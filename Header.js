import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import { getTheme, setTheme } from "../js/auth";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { isAuthed, user, flags, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  };

  return (
    <header className={`main-header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="nav-left">
        <NavLink to="/" className="logo-container">
          <span className="logo-text">مكمن</span>
          <img src={logo} alt="Makman" className="logo-img" />
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>الرئيسية</NavLink>
          <NavLink to="/subscription" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>الاشتراكات</NavLink>

          {flags?.demo && (
            <NavLink to="/demo" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>تجربة</NavLink>
          )}



          {isAuthed && flags?.settings && (
            <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>الإعدادات</NavLink>
          )}

          {isAuthed && flags?.branches && (
            <NavLink to="/branches" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>الفروع</NavLink>
          )}

          {isAuthed && flags?.alerts && (
            <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>التنبيهات</NavLink>
          )}

          {isAuthed && flags?.reports && (
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>التقارير</NavLink>
          )}

          {isAuthed && flags?.usersAdmin && (
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>المستخدمين</NavLink>
          )}

          {isAuthed && (
            <NavLink to="/new-chatbot" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>المساعد الذكي</NavLink>
          )}

          {isAuthed && (
            <NavLink to="/video-analysis" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>تحليل الفيديو</NavLink>
          )}

          {isAuthed && (
            <NavLink to="/analytics-dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>لوحة التحليلات</NavLink>
          )}
        </nav>
      </div>

      <div className="nav-btns">
        <button className="icon-btn" onClick={toggleTheme} title="تبديل المظهر">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {isAuthed ? (
          <>
            <button className="btn-login btn-ripple" onClick={() => navigate("/profile")}>ملفي الشخصي</button>
            <button className="btn-login btn-ripple" onClick={() => navigate("/")}>
              {user?.companyName ? user.companyName : "لوحة التحكم"}
            </button>
            <button className="btn-register btn-ripple" onClick={logout}>تسجيل خروج</button>
          </>
        ) : (
          <>
            <button className="btn-login btn-ripple" onClick={() => navigate("/login")}>تسجيل دخول</button>
            <button className="btn-register btn-ripple" onClick={() => navigate("/register")}>إنشاء حساب</button>
          </>
        )}
      </div>
    </header>
  );
}
