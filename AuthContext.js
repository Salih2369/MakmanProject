import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken, getUser, setUser as persistUser } from "../js/auth";

export const AuthContext = createContext({
  token: null,
  user: null,
  isAuthed: false,
  login: async () => { },
  loginWithToken: async () => { },
  logout: () => { },
  refresh: async () => { },
  setUser: () => { },
});

export const useAuth = () => useContext(AuthContext);

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getUser());

  const isAuthed = !!token;

  const setUser = useCallback((u) => {
    setUserState(u || null);
    persistUser(u || null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUserState(null);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || "فشل تسجيل الدخول";
        throw new Error(msg);
      }

      if (data?.token) {
        setToken(data.token);
        setTokenState(data.token);
      }
      if (data?.user) setUser(data.user);

      return data;
    },
    [setUser]
  );

  const loginWithToken = useCallback(
    async (t) => {
      if (!t) throw new Error("Token is required");
      setToken(t);
      setTokenState(t);

      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) setUser(data.user);
        }
      } catch (_) { }
    },
    [setUser]
  );

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) setUser(data.user);
      }
    } catch (_) { }
  }, [setUser]);

  useEffect(() => {
    const onStorage = () => {
      setTokenState(getToken());
      setUserState(getUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed,
      login,
      loginWithToken,
      logout,
      refresh,
      setUser,
    }),
    [token, user, isAuthed, login, loginWithToken, logout, refresh, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
