import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";
import { motion } from "framer-motion";
import { updateProfile } from "../js/api";

export default function Profile() {
    const { token, user, refresh } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || "",
        companyName: user?.companyName || "",
        phoneNumber: user?.phoneNumber || "",
        avatarUrl: user?.avatarUrl || "",
        bio: user?.bio || "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const save = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(token, formData);
            await refresh();
            toast.success("تم التحديث", "تم تحديث الملف الشخصي بنجاح.");
        } catch (err) {
            toast.error("خطأ", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrap">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-container"
            >
                <div className="profile-header glass-card">
                    <div className="profile-avatar-large">
                        {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">{user?.email?.[0].toUpperCase()}</div>
                        )}
                    </div>
                    <div className="profile-info-text">
                        <h2>{user?.fullName || "مستخدم مكمن"}</h2>
                        {user?.companyName && <p className="company-subtitle">{user.companyName}</p>}
                        <p className="muted">{user?.email}</p>
                        <span className="badge-role">{user?.role}</span>
                    </div>
                </div>

                <form onSubmit={save} className="profile-form glass-card">
                    <h3>تعديل الملف الشخصي</h3>

                    <div className="form-group">
                        <label>الاسم الكامل</label>
                        <input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="أدخل اسمك الكامل"
                        />
                    </div>

                    <div className="form-group">
                        <label>اسم الشركة</label>
                        <input
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="مثال: مكمن للحلول"
                        />
                    </div>

                    <div className="form-group">
                        <label>رقم الجوال</label>
                        <input
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="مثال: +966..."
                        />
                    </div>

                    <div className="form-group">
                        <label>رابط الصورة الشخصية (URL)</label>
                        <input
                            name="avatarUrl"
                            value={formData.avatarUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="form-group">
                        <label>نبذة تعريفية</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="أخبرنا قليلاً عن نفسك..."
                            rows={3}
                        />
                    </div>

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                </form>
            </motion.div>

            <style>{`
        .profile-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 25px;
          padding: 30px;
        }

        .profile-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: bold;
        }

        .profile-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder { color: var(--primary); }

        .profile-info-text h2 { margin: 0; font-size: 1.8rem; }
        .company-subtitle { margin: 2px 0; color: var(--primary); font-weight: 600; font-size: 1rem; }
        .profile-info-text p { margin: 5px 0 10px; }

        .badge-role {
          background: rgba(120, 160, 255, 0.2);
          color: #78a0ff;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: bold;
          border: 1px solid rgba(120, 160, 255, 0.3);
        }

        .profile-form {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-form h3 { margin: 0 0 10px; font-size: 1.4rem; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        .form-group input, .form-group textarea {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 15px;
          color: white;
          outline: none;
          transition: 0.3s;
        }

        .form-group input:focus, .form-group textarea:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.08);
        }

        .primary-btn {
          margin-top: 10px;
          border-radius: 12px;
        }
      `}</style>
        </div>
    );
}
