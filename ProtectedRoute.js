import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthed, booting } = useAuth();
  if (booting) return null;
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export function OnboardedRoute({ children }) {
  const { isAuthed, user, booting } = useAuth();
  if (booting) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!user?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

export function FlagRoute({ flag, children }) {
  const { flags, booting } = useAuth();
  if (booting) return null;
  return flags?.[flag] ? children : <Navigate to="/" replace />;
}
