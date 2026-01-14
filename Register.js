import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerRequest } from "../js/api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const { loginWithToken, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerRequest(email.trim().toLowerCase(), password);
      await loginWithToken(data.token);
      await refresh();
      toast.success("تم إنشاء الحساب", "الآن أكمل تهيئة الحساب.");
      navigate("/onboarding");
    } catch (err) {
      toast.error("تعذر التسجيل", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <h2 className="auth-title">إنشاء حساب جديد</h2>
        <p className="auth-sub">ابدأ خلال دقيقة واحدة.</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <label className="field-label" htmlFor="email">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="password">كلمة المرور</label>
          <input
            id="password"
            type="password"
            placeholder="على الأقل 8 أحرف"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-register btn-ripple btn-full" type="submit" disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "تسجيل الحساب"}
          </button>
        </form>

        <p className="link-muted" onClick={() => navigate("/login")}>
          تمتلك حساباً؟ سجل دخولك
        </p>
      </div>
    </div>
  );
}
