import { apiRequest, apiBase } from "../api/client";

export const loginRequest = (email, password) =>
  apiRequest("/api/login", { method: "POST", body: { email, password } });

export const registerRequest = (email, password) =>
  apiRequest("/api/register", { method: "POST", body: { email, password } });

export const fetchMe = (token) =>
  apiRequest("/api/users/me", { token });

export const updateProfile = (token, payload) =>
  apiRequest("/api/users/me/profile", { method: "PUT", token, body: payload });

export const uploadVideo = (token, formData, onProgress) => {
  // We use fetch directly for upload to support progress tracking if needed, 
  // though apiRequest is simplified. For now, keep it simple.
  const BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || "http://localhost:5000";
  return fetch(`${BASE}/api/video/upload?analyze=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }).then(res => res.json());
};

export const saveOnboarding = (token, payload) =>
  apiRequest("/api/users/me/onboarding", { method: "PUT", token, body: payload });

export const saveSettings = (token, payload) =>
  apiRequest("/api/users/me/settings", { method: "PUT", token, body: payload });

export const fetchFlags = (token) =>
  apiRequest("/api/features/me", { token });

export const selectPlan = (token, plan) =>
  apiRequest("/api/subscriptions/select-plan", { method: "POST", token, body: { plan } });

export const fetchSubscription = (token) =>
  apiRequest("/api/subscriptions/me", { token });

export const adminListUsers = (token) =>
  apiRequest("/api/users", { token });

export const adminUpdateRole = (token, id, role) =>
  apiRequest(`/api/users/${id}/role`, { method: "PUT", token, body: { role } });

export const fetchAlerts = (token) =>
  apiRequest("/api/alerts", { token });

export const fetchBranches = (token) =>
  apiRequest("/api/branches", { token });

export const exportReportUrl = () => `${apiBase}/api/reports/export`;
