import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Demo() {
  const navigate = useNavigate();
  const { isAuthed, user, flags } = useAuth();

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">تجربة مكمن</h1>
        <p className="page-sub">واجهة عرض سريعة لفكرة المنتج قبل التسجيل.</p>
      </div>

      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>نظرة عامة</div>
            <div className="muted">هنا نعرض شكل المنتج وكيف تظهر المميزات حسب الباقة.</div>
          </div>
          <div className="hero-actions">
            {isAuthed ? (
              <button className="btn-register btn-ripple" onClick={() => navigate(user?.onboardingComplete ? "/dashboard" : "/onboarding")}>
                اذهب للوحة التحكم
              </button>
            ) : (
              <>
                <button className="btn-register btn-ripple" onClick={() => navigate("/register")}>إنشاء حساب</button>
                <button className="btn-login btn-ripple" onClick={() => navigate("/login")}>تسجيل دخول</button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 14 }}>
          <div className="glass-card" style={{ padding: 14 }}>
            <div className="pill pill-ai">AI</div>
            <div style={{ fontWeight: 900, marginTop: 8 }}>تنبيه نشاط غير اعتيادي</div>
            <div className="muted">أولوية عالية • فرع العليا</div>
          </div>
          <div className="glass-card" style={{ padding: 14 }}>
            <div className="pill pill-ok">OK</div>
            <div style={{ fontWeight: 900, marginTop: 8 }}>ازدحام متوسط</div>
            <div className="muted">أولوية متوسطة • فرع النخيل</div>
          </div>
          <div className="glass-card" style={{ padding: 14 }}>
            <div className="pill pill-warn">Reports</div>
            <div style={{ fontWeight: 900, marginTop: 8 }}>تصدير تقرير</div>
            <div className="muted">متاح حسب الباقة</div>
          </div>
        </div>

        <div className="hint" style={{ marginTop: 14 }}>
          <span className="muted">
            الميزات المتاحة الآن حسب حسابك:{" "}
            <b className="text-strong">
              branches={String(flags?.branches)} • reports={String(flags?.reports)} • export={String(flags?.exportReports)} • admin={String(flags?.usersAdmin)}
            </b>
          </span>
        </div>
      </div>
    </div>
  );
}
