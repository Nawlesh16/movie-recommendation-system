// PHASE 3: the REAL login state, powered by the backend.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "./AuthContext"; // your existing context object
import * as authService from "../services/authService";
import { UNAUTHORIZED_EVENT } from "../services/apiClient";
import { getToken, saveToken, clearToken } from "../utils/tokenStorage";

// React Query stores the logged-in user in its cache under this key.
const AUTH_QUERY_KEY = ["auth", "me"];

// Your existing pages may call login(email, password) or login({ email, password }).
// These helpers accept both styles.
const isObject = (value) => typeof value === "object" && value !== null;
const toLoginInput = (a, b) => (isObject(a) ? a : { email: a, password: b });
const toRegisterInput = (a, b, c) => (isObject(a) ? a : { name: a, email: b, password: c });

export function ApiAuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => getToken());

  // Ask the backend who we are, but only if we have a token.
  const profileQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.getProfile,
    enabled: Boolean(token),
    retry: false, // a 401 will not fix itself, so don't retry
    staleTime: 5 * 60 * 1000, // treat the profile as fresh for 5 minutes
  });

  // Forget everything about the current user (token + cached data).
  const endSession = useCallback(() => {
    clearToken();
    setToken(null);
    queryClient.removeQueries();
  }, [queryClient]);

  // apiClient fires this event when the backend answers 401 (expired/invalid token).
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, endSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, endSession);
  }, [endSession]);

  // Save the token and put the user straight into the cache (no extra request needed).
  const startSession = ({ user, token: newToken }) => {
    saveToken(newToken);
    setToken(newToken);
    queryClient.setQueryData(AUTH_QUERY_KEY, user);
  };

  const loginMutation = useMutation({ mutationFn: authService.login, onSuccess: startSession });
  const registerMutation = useMutation({ mutationFn: authService.register, onSuccess: startSession });
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    // Runs whether the request worked or failed: the user must end up logged out either way.
    onSettled: endSession,
  });
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser),
  });

  const { mutateAsync: loginAsync } = loginMutation;
  const { mutateAsync: registerAsync } = registerMutation;
  const { mutateAsync: logoutAsync } = logoutMutation;
  const { mutateAsync: updateProfileAsync } = updateProfileMutation;

  // Each function returns a promise. On failure it throws an Error whose
  // `.message` is user-friendly and whose `.fieldErrors` is e.g. { email: "..." }.
  const login = useCallback(async (a, b) => (await loginAsync(toLoginInput(a, b))).user, [loginAsync]);
  const register = useCallback(
    async (a, b, c) => (await registerAsync(toRegisterInput(a, b, c))).user,
    [registerAsync]
  );
  const logout = useCallback(async () => {
    await logoutAsync();
  }, [logoutAsync]);
  const updateProfile = useCallback((input) => updateProfileAsync(input), [updateProfileAsync]);

  const user = token ? profileQuery.data ?? null : null;
  // "loading" = we have a token but haven't heard back from the backend yet.
  const loading = Boolean(token) && profileQuery.isLoading;

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      // Flags for spinners / disabled buttons.
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      isUpdatingProfile: updateProfileMutation.isPending,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      loginMutation.isPending,
      registerMutation.isPending,
      logoutMutation.isPending,
      updateProfileMutation.isPending,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
