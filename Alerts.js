import React, { useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../js/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";

export default function Alerts() {
  const { token } = useAuth();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [branch, setBranch] = useState("all");
  const [priority, setPriority] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAlerts(token);
        setAlerts(data.alerts || []);
      } catch (e) {
        toast.error("فشل تحميل التنبيهات", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // eslint-disable-line

  const branches = useMemo(() => Array.from(new Set(alerts.map(a => a.branch))), [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const okBranch = branch === "all" || a.branch === branch;
      const okPr = priority === "all" || a.pr === priority;
      const okQ = !q.trim() || `${a.title} ${a.branch} ${a.type}`.toLowerCase().includes(q.trim().toLowerCase());
      return okBranch && okPr && okQ;
    });
  }, [alerts, branch, priority, q]);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">سجل التنبيهات</h1>
        <p className="page-sub">تصفية ومراجعة الأحداث حسب الفرع والأولوية.</p>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10 }}>
          <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="all">كل الفروع</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">كل الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          <input className="search" placeholder="ابحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div className="muted">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="muted">لا توجد نتائج.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map(a => (
                <div key={a.id} className="glass-card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{a.title}</div>
                      <div className="muted">{a.branch} • {a.time}</div>
                    </div>
                    <span className={`pill ${a.type === "AI" ? "pill-ai" : "pill-ok"}`}>{a.type}</span>
                  </div>
                  <div style={{ marginTop: 8 }} className="muted">الأولوية: <b className="text-strong">{a.pr}</b></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
