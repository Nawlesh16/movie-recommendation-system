// The ONLY file that reads/writes the login token in the browser.
// Keeping it in one place means that if we later change WHERE the token lives
// (for example, an httpOnly cookie), we only edit this file.
//
// Trade-off to know about: localStorage is simple and survives page refreshes,
// but JavaScript on the page can read it. That is acceptable for this learning
// project as long as we never render untrusted HTML (React escapes text by default).

const TOKEN_KEY = "movie_app_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage can be blocked (private mode, strict browser settings)
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore: the user just won't stay logged in after a refresh
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
