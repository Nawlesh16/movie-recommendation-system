// The ONE configured Axios instance that talks to OUR backend.
// It does three jobs:
//   1. knows the backend URL (from VITE_API_URL)
//   2. attaches "Authorization: Bearer <token>" to every request automatically
//   3. turns every failure into a simple Error with a friendly message
import axios from "axios";
import { getToken, clearToken } from "../utils/tokenStorage";

// AuthContext listens for this browser event so it can log the user out
// when the backend says the token is no longer valid.
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000, // give up after 15 seconds
  headers: { "Content-Type": "application/json" },
});

// ---- Request interceptor: runs before EVERY request ----
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On these endpoints a 401 only means "wrong email or password",
// NOT "your session expired", so we must not log anyone out because of it.
const CREDENTIAL_ENDPOINTS = ["/auth/login", "/auth/register"];

// Backend validation errors look like: [{ field: "email", message: "..." }].
// Convert that to { email: "..." } so a form can show each message under its input.
function toFieldErrors(errors) {
  const result = {};
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (item.field && !result[item.field]) {
        result[item.field] = item.message;
      }
    }
  }
  return result;
}

function toFriendlyError(error) {
  let message;

  if (error.response) {
    // The backend answered with an error status. Its JSON has a "message".
    message = error.response.data?.message || `Request failed (status ${error.response.status})`;
  } else if (error.code === "ECONNABORTED") {
    message = "The server took too long to respond. Please try again.";
  } else {
    message = "Cannot reach the server. Check your connection and make sure the backend is running.";
  }

  const friendly = new Error(message);
  friendly.status = error.response?.status ?? null;
  friendly.fieldErrors = toFieldErrors(error.response?.data?.errors);
  return friendly;
}

// ---- Response interceptor: runs when a request FAILS ----
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error); // request was cancelled on purpose
    }

    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isCredentialCall = CREDENTIAL_ENDPOINTS.some((path) => url.includes(path));

    // 401 on a normal request while we hold a token = token expired, invalid, or logged out elsewhere.
    if (status === 401 && !isCredentialCall && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(toFriendlyError(error));
  }
);

export default apiClient;
