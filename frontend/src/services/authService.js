// One function per backend auth endpoint. No React in here, just API calls.
// Each function returns the useful part of the response (the "data" object
// described in backend/README.md), so components never deal with raw Axios responses.
import apiClient from "./apiClient";

// POST /auth/register  ->  { user, token }
export async function register({ name, email, password }) {
  const { data } = await apiClient.post("/auth/register", { name, email, password });
  return data.data;
}

// POST /auth/login  ->  { user, token }
export async function login({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data.data;
}

// POST /auth/logout  (needs token)  ->  tells the backend to invalidate all tokens of this user
export async function logout() {
  await apiClient.post("/auth/logout");
}

// GET /users/me  (needs token)  ->  user
export async function getProfile() {
  const { data } = await apiClient.get("/users/me");
  return data.data.user;
}

// PATCH /users/me  (needs token)  ->  updated user
export async function updateProfile({ name }) {
  const { data } = await apiClient.patch("/users/me", { name });
  return data.data.user;
}
