import React, { useEffect, useState } from "react";
import { adminListUsers, adminUpdateRole } from "../js/api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";

export default function AdminUsers() {
  const { token } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminListUsers(token);
      setUsers(data.users || []);
    } catch (e) {
      toast.error("فشل تحميل المستخدمين", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const changeRole = async (id, role) => {
    try {
      await adminUpdateRole(token, id, role);
      toast.success("تم", "تم تحديث الدور.");
      await load();
    } catch (e) {
      toast.error("فشل التحديث", e.message);
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">إدارة المستخدمين</h1>
        <p className="page-sub">هذه الصفحة للأدمن فقط.</p>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        {loading ? (
          <div className="muted">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="muted">لا يوجد مستخدمين.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {users.map(u => (
              <div key={u._id} className="glass-card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{u.email}</div>
                  <div className="muted">
                    Role: <b className="text-strong">{u.role}</b> • Plan: <b className="text-strong">{u.plan}</b>
                  </div>
                </div>

                <select className="select" value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} style={{ width: 160 }}>
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="viewer">viewer</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
