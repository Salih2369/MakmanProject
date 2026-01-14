import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveOnboarding } from "../js/api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { token, user, refresh } = useAuth();

  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [businessType, setBusinessType] = useState(user?.businessType || "coffee");
  const [branchesCount, setBranchesCount] = useState(user?.branchesCount || 1);
  const [firstBranch, setFirstBranch] = useState(user?.firstBranch || "");
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveOnboarding(token, {
        companyName,
        businessType,
        branchesCount: Number(branchesCount),
        firstBranch
      });
      await refresh();
      toast.success("تم", "تم حفظ بيانات التهيئة بنجاح.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("تعذر الحفظ", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <h2 className="auth-title">تهيئة حسابك</h2>
        <p className="auth-sub">خلّنا نجهز لوحة التحكم بناءً على نشاطك.</p>

        <form className="auth-form" onSubmit={save}>
          <label className="field-label">اسم الشركة</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="مثال: Makman Co." required />

          <label className="field-label">نوع النشاط</label>
          <select className="select" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
            <option value="store">متجر</option>
            <option value="coffee">كوفي</option>
            <option value="market">سوبرماركت</option>
            <option value="company">شركة / مؤسسة</option>
          </select>

          <label className="field-label">عدد الفروع</label>
          <input type="number" min="1" max="200" value={branchesCount} onChange={(e) => setBranchesCount(e.target.value)} required />

          <label className="field-label">اسم أول فرع</label>
          <input value={firstBranch} onChange={(e) => setFirstBranch(e.target.value)} placeholder="مثال: فرع العليا" required />

          <button className="btn-register btn-ripple btn-full" type="submit" disabled={loading}>
            {loading ? "جاري الحفظ..." : "إنهاء الإعداد"}
          </button>
        </form>
      </div>
    </div>
  );
}
