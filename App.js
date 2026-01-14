import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import "./css/style.css";

import Header from "./components/Header";
import ToastProvider from "./components/ToastProvider";
import AuthProvider from "./auth/AuthContext";

import Home from "./pages/Home";
import Subscription from "./pages/Subscription";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Demo from "./pages/Demo";
import Onboarding from "./pages/Onboarding";

import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Branches from "./pages/Branches";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";
import NewChatbot from "./pages/NewChatbot";
import Profile from "./pages/Profile";
import VideoAnalysis from "./pages/VideoAnalysis";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

import { getToken, getUser, initTheme, getFeatureFlags } from "./js/auth";

const RequireAuth = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
};

const RequireOnboarding = ({ children }) => {
  const token = getToken();
  const u = getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (!u?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
};

const pageAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

const RouteShell = ({ children }) => (
  <motion.div variants={pageAnim} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const flags = getFeatureFlags();

  return (
    <main className="app-shell">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteShell><Home /></RouteShell>} />
          <Route path="/subscription" element={<RouteShell><Subscription /></RouteShell>} />

          <Route
            path="/demo"
            element={flags.demo ? <RouteShell><Demo /></RouteShell> : <Navigate to="/" replace />}
          />

          <Route path="/login" element={<RouteShell><Login /></RouteShell>} />
          <Route path="/register" element={<RouteShell><Register /></RouteShell>} />

          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <RouteShell><Onboarding /></RouteShell>
              </RequireAuth>
            }
          />



          <Route
            path="/settings"
            element={
              <RequireOnboarding>
                {flags.settings ? <RouteShell><Settings /></RouteShell> : <Navigate to="/" replace />}
              </RequireOnboarding>
            }
          />

          <Route
            path="/alerts"
            element={
              <RequireOnboarding>
                {flags.alerts ? <RouteShell><Alerts /></RouteShell> : <Navigate to="/" replace />}
              </RequireOnboarding>
            }
          />

          <Route
            path="/branches"
            element={
              <RequireOnboarding>
                {flags.branches ? <RouteShell><Branches /></RouteShell> : <Navigate to="/" replace />}
              </RequireOnboarding>
            }
          />

          <Route
            path="/reports"
            element={
              <RequireOnboarding>
                {flags.reports ? <RouteShell><Reports /></RouteShell> : <Navigate to="/" replace />}
              </RequireOnboarding>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RequireOnboarding>
                {flags.usersAdmin ? <RouteShell><AdminUsers /></RouteShell> : <Navigate to="/" replace />}
              </RequireOnboarding>
            }
          />

          {/* ✅ صفحة الشات بوت الجديد */}
          <Route
            path="/new-chatbot"
            element={
              <RequireOnboarding>
                <RouteShell><NewChatbot /></RouteShell>
              </RequireOnboarding>
            }
          />

          {/* ✅ صفحة الملف الشخصي */}
          <Route
            path="/profile"
            element={
              <RequireOnboarding>
                <RouteShell><Profile /></RouteShell>
              </RequireOnboarding>
            }
          />

          <Route
            path="/video-analysis"
            element={
              <RequireOnboarding>
                <RouteShell><VideoAnalysis /></RouteShell>
              </RequireOnboarding>
            }
          />

          {/* ✅ صفحة لوحة التحليلات */}
          <Route
            path="/analytics-dashboard"
            element={
              <RequireOnboarding>
                <RouteShell><AnalyticsDashboard /></RouteShell>
              </RequireOnboarding>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </main>
  );
};

export default function App() {
  const [boot, setBoot] = useState(true);

  useEffect(() => {
    initTheme();
    const t = setTimeout(() => setBoot(false), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          {boot && (
            <div className="app-boot">
              <div className="boot-dot" />
              <div className="boot-dot" />
              <div className="boot-dot" />
            </div>
          )}

          <Header />
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
