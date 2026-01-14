import React, { useEffect, useState } from "react";
import { fetchBranches } from "../js/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";

export default function Branches() {
  const { token } = useAuth();
  const toast = useToast();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBranches(token);
        setBranches(data.branches || []);
      } catch (e) {
        toast.error("فشل تحميل الفروع", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // eslint-disable-line

  const badge = (s) => {
    if (s === "ok") return <span className="pill pill-ok">OK</span>;
    if (s === "warn") return <span className="pill pill-warn">WARN</span>;
    return <span className="pill">—</span>;
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">الفروع</h1>
        <p className="page-sub">مراقبة الفروع وحالة الكاميرات.</p>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        {loading ? (
          <div className="muted">جاري التحميل...</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {branches.map(b => (
              <div key={b.id} className="glass-card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{b.name}</div>
                  <div className="muted">{b.city} • كاميرات: {b.cameras} • آخر ظهور: {b.lastSeen}</div>
                </div>
                {badge(b.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
