import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PLAN = {
  TRIAL: "trial",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
};

const PLAN_LABEL = {
  trial: "الباقة التجريبية",
  business: "باقة الأعمال",
  enterprise: "باقة المؤسسات",
};

export default function Subscription() {
  const navigate = useNavigate();
  const toast = useToast();
  const { token, user, refresh } = useAuth();

  const currentPlan = (user?.plan || "trial").toLowerCase();

  const plans = useMemo(
    () => [
      {
        key: PLAN.TRIAL,
        title: "الباقة التجريبية",
        price: "1649 ريال",
        period: "/شهر",
        note: "لبداية سريعة وتجربة المنصة",
        features: ["فرع واحد", "تنبيهات أساسية", "لوحة تحكم مبسطة", "دعم محدود"],
        btnClass: "btn-login",
        btnText: currentPlan === PLAN.TRIAL ? "مفعّلة الآن" : "اشترك الآن",
      },
      {
        key: PLAN.BUSINESS,
        title: "باقة الأعمال",
        price: "7299 ريال",
        period: "/شهر",
        note: "أفضل خيار لمعظم الفروع",
        features: [
          "حتى 5 فروع",
          "تنبيهات متقدمة",
          "تقارير قابلة للتصدير",
          "صلاحيات للموظفين (RBAC)",
          "دعم أسرع",
        ],
        btnClass: "btn-register",
        btnText: currentPlan === PLAN.BUSINESS ? "مفعّلة الآن" : "اشترك الآن",
        popular: true,
      },
      {
        key: PLAN.ENTERPRISE,
        title: "باقة المؤسسات",
        price: "تواصل معنا",
        note: "حل مخصص للشركات الكبيرة",
        features: [
          "فروع غير محدودة",
          "تخصيص كامل للمنصة",
          "تجهيزات وتقارير مخصصة",
          "دعم فني مخصص",
          "اتفاقية مستوى خدمة (SLA)",
        ],
        btnClass: "btn-login",
        btnText: currentPlan === PLAN.ENTERPRISE ? "مفعّلة الآن" : "تواصل معنا",
      },
    ],
    [currentPlan]
  );

  const selectPlan = async (plan) => {
    const label = PLAN_LABEL[plan] || plan;

    if (!token) {
      toast.info("تسجيل الدخول مطلوب", "سجل دخولك ثم اختر الباقة.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error("فشل التحديث", data?.error || "تعذر تحديث الاشتراك.");
        return;
      }

      // ✅ يحدث user/plan في AuthContext عشان الداشبورد يتغير فورًا
      await refresh();

      toast.success("تم التحديث", `تم تفعيل ${label} بنجاح.`);
      navigate("/dashboard");
    } catch (e) {
      toast.error("خطأ اتصال", "تعذر الاتصال بالخادم.");
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">باقات مكمن</h1>
        <p className="page-sub">اختر الخطة المناسبة لنمو أعمالك</p>
      </div>

      <div className="pricing-grid">
        {plans.map((p) => {
          const isActive = currentPlan === p.key;

          return (
            <div key={p.key} className={`pricing-card ${p.popular ? "popular" : ""}`}>
              {p.popular && <div className="badge-popular">الأكثر رواجاً</div>}

              <h2 className="plan-title">{p.title}</h2>

              <div className="price">
                {p.price} {p.period ? <small>{p.period}</small> : null}
              </div>

              {p.note ? <div className="plan-note">{p.note}</div> : null}

              <ul className="feature-list">
                {p.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>

              <button
                className={`${p.btnClass} btn-ripple btn-full`}
                onClick={() => selectPlan(p.key)}
                disabled={isActive}
                style={isActive ? { opacity: 0.75, cursor: "not-allowed" } : undefined}
              >
                {p.btnText}
              </button>

              {isActive ? (
                <div className="plan-active-hint" style={{ marginTop: 12, opacity: 0.85 }}>
                  ✅ هذه باقتك الحالية
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <footer className="footer-note">
        جميع الباقات تشمل تشفير البيانات + تحديثات مستمرة. يمكنك تغيير الباقة في أي وقت.
      </footer>
    </div>
  );
}
