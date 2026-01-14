import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { saveSettings } from "../js/api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";

export default function Settings() {
  const toast = useToast();

  const { token, user, refresh } = useAuth();

  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [alertsEmail, setAlertsEmail] = useState(user?.alertsEmail ?? true);
  const [alertsWhatsapp, setAlertsWhatsapp] = useState(user?.alertsWhatsapp ?? false);

  const roleLabel = useMemo(() => {
    if (user?.role === "admin") return "Admin (مدير النظام)";
    if (user?.role === "manager") return "Manager (مدير)";
    return "Viewer (مشاهد)";
  }, [user?.role]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await saveSettings(token, { companyName, alertsEmail, alertsWhatsapp });
      await refresh();
      toast.success("تم الحفظ", "تم حفظ الإعدادات بنجاح.");
    } catch (err) {
      toast.error("فشل الحفظ", err.message);
    }
  };

  return (
    <div className="page-wrap">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="settings-layout"
      >
        <div className="settings-header">
          <h1 className="page-title">إعدادات المنصة</h1>
          <p className="page-sub">تحكم في هوية شركتك، قنوات التنبيه، وتفضيلات النظام.</p>
        </div>

        <div className="settings-grid">
          <form onSubmit={save} className="settings-main glass-card">
            <section className="settings-section">
              <h3>هوية المنشأة</h3>
              <div className="input-group">
                <label>اسم الشركة</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: مكمن للحلول التقنية"
                />
              </div>
            </section>

            <section className="settings-section">
              <h3>تفضيلات التنبيهات</h3>
              <div className="notification-options">
                <div className="option-card glass-card">
                  <div className="option-info">
                    <span className="option-icon">📧</span>
                    <div>
                      <h4>البريد الإلكتروني</h4>
                      <p>تقارير دورية وملخصات أسبوعية.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertsEmail}
                    onChange={(e) => setAlertsEmail(e.target.checked)}
                  />
                </div>

                <div className="option-card glass-card">
                  <div className="option-info">
                    <span className="option-icon">💬</span>
                    <div>
                      <h4>واتساب (WhatsApp)</h4>
                      <p>تنبيهات فورية للحالات الحرجة.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertsWhatsapp}
                    onChange={(e) => setAlertsWhatsapp(e.target.checked)}
                  />
                </div>
              </div>
            </section>

            <div className="settings-actions">
              <button type="submit" className="primary-btn">حفظ الإعدادات</button>
            </div>
          </form>

          <aside className="settings-sidebar">
            <div className="glass-card info-card">
              <h3>حسابك</h3>
              <div className="info-row">
                <span className="label">الدور:</span>
                <span className="value">{roleLabel}</span>
              </div>
              <div className="info-row">
                <span className="label">الخطة:</span>
                <span className="value plan-badge">{user?.plan || "trial"}</span>
              </div>
              <div className="info-row">
                <span className="label">الحالة:</span>
                <span className="value">{user?.onboardingComplete ? "✅ مكتمل" : "⚠️ يحتاج تهيئة"}</span>
              </div>
            </div>

            <div className="glass-card hint-card">
              <h4>نصيحة ذكية 💡</h4>
              <p>تفعيل تنبيهات واتساب يساعدك على الاستجابة السريعة للحالات الطارئة في الفروع.</p>
            </div>
          </aside>
        </div>
      </motion.div>

      <style>{`
        .settings-layout {
          max-width: 1100px;
          margin: 0 auto;
        }

        .settings-header { margin-bottom: 30px; }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 25px;
        }

        .settings-main { padding: 30px; display: flex; flex-direction: column; gap: 35px; }

        .settings-section h3 { margin: 0 0 20px; font-size: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }

        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.9rem; opacity: 0.8; }
        .input-group input { 
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 12px; 
          padding: 12px 15px; 
          color: white; 
          outline: none;
        }

        .notification-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .option-card {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.03);
          transition: 0.3s;
        }

        .option-card:hover { background: rgba(255,255,255,0.06); }

        .option-info { display: flex; gap: 12px; align-items: center; }
        .option-icon { font-size: 1.5rem; }
        .option-info h4 { margin: 0; font-size: 0.95rem; }
        .option-info p { margin: 3px 0 0; font-size: 0.75rem; opacity: 0.6; }

        .option-card input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .settings-actions { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 25px; }

        .settings-sidebar { display: flex; flex-direction: column; gap: 20px; }
        .info-card, .hint-card { padding: 20px; }
        
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .info-row:last-child { border: none; }
        .info-row .label { opacity: 0.6; font-size: 0.9rem; }
        .info-row .value { font-weight: bold; font-size: 0.9rem; }

        .plan-badge {
          background: var(--primary);
          color: black;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .hint-card h4 { margin: 0 0 10px; }
        .hint-card p { margin: 0; font-size: 0.85rem; line-height: 1.5; opacity: 0.8; }

        @media (max-width: 900px) {
          .settings-grid { grid-template-columns: 1fr; }
          .notification-options { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
