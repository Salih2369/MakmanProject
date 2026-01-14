import React from "react";
import { exportReportUrl } from "../js/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";

export default function Reports() {
  const { token, flags } = useAuth();
  const toast = useToast();

  const download = async () => {
    if (!flags?.exportReports) {
      toast.warning("غير متاح", "ميزة تصدير التقارير متاحة في خطط أعلى.");
      return;
    }

    try {
      const res = await fetch(exportReportUrl(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("تعذر تنزيل التقرير");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "makman-report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("تم", "تم تنزيل التقرير بنجاح.");
    } catch (e) {
      toast.error("فشل التصدير", e.message);
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">التقارير</h1>
        <p className="page-sub">تصدير CSV وعرض ملخصات حسب الخطة.</p>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div className="muted">
          حالة التصدير في باقتك:{" "}
          <b className="text-strong">{flags?.exportReports ? "متاح" : "غير متاح"}</b>
        </div>

        <button className="btn-register btn-ripple" style={{ marginTop: 12 }} onClick={download}>
          تصدير تقرير CSV
        </button>

        {!flags?.exportReports && (
          <div className="hint" style={{ marginTop: 12 }}>
            <span className="muted">قم بالترقية لباقة الأعمال أو المؤسسات لتفعيل التصدير.</span>
          </div>
        )}
      </div>
    </div>
  );
}
