// src/js/auth.js
// Helpers for token/user/theme + feature flags.

const TOKEN_KEY = "makman_token";
const USER_KEY = "makman_user";
const THEME_KEY = "makman_theme";
const FLAGS_KEY = "makman_flags"; // optional override

export function setToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * صلاحيات بسيطة (RBAC)
 * user.role: "admin" | "manager" | "viewer"
 */
export function hasRole(...roles) {
  const u = getUser();
  if (!u?.role) return false;
  return roles.includes(u.role);
}

/**
 * Permissions: user.permissions: string[]
 * مثل: branches, reports, export, users, alerts, settings
 */
export function hasPermission(perm) {
  const u = getUser();
  const perms = u?.permissions || [];
  return perms.includes(perm) || u?.role === "admin";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme || "dark");
  document.documentElement.setAttribute("data-theme", theme || "dark");
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function initTheme() {
  setTheme(getTheme());
}

export function getFeatureFlags() {
  const defaults = {
    demo: true,
    branches: true,
    reports: true,
    export: true,
    usersAdmin: true,
    alerts: true,
    settings: true,
    chatbot: true,
  };

  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (!raw) return defaults;
    const overrides = JSON.parse(raw);
    return { ...defaults, ...(overrides || {}) };
  } catch {
    return defaults;
  }
}

export function setFeatureFlags(flags) {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags || {}));
}
