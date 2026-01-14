import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginRequest } from "../js/api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const { loginWithToken, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginRequest(email.trim().toLowerCase(), password);
      await loginWithToken(data.token);
      await refresh();
      toast.success("تم تسجيل الدخول", "مرحبًا بك في مكمن!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error("فشل تسجيل الدخول", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <h2 className="auth-title">تسجيل الدخول</h2>
        <p className="auth-sub">أدخل بياناتك للوصول للوحة التحكم.</p>

        <form className="auth-form" onSubmit={handleLogin}>
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-register btn-ripple btn-full" type="submit" disabled={loading}>
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <p className="link-muted" onClick={() => navigate("/register")}>
          ليس لديك حساب؟ انضم إلينا الآن
        </p>
      </div>
    </div>
  );
}
