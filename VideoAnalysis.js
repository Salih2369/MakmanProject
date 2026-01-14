import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/ToastProvider";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import {
    CloudUpload, Play, BarChart3, Users, UserCheck, ShieldCheck,
    CheckCircle2, AlertCircle, Activity, Clock, RefreshCw, Video, Upload
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Colors
const COLORS = {
    blue: '#3b82f6',
    teal: '#14b8a6',
    purple: '#8b5cf6',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e'
};

// Styles
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        padding: '32px',
        direction: 'rtl'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px'
    },
    title: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '16px'
    },
    uploadCard: {
        backgroundColor: '#1e293b',
        borderRadius: '20px',
        padding: '60px 40px',
        border: '2px dashed #334155',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    uploadCardActive: {
        backgroundColor: '#1e3a5f',
        borderColor: '#3b82f6'
    },
    uploadIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#3b82f620',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
    },
    uploadTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '8px'
    },
    uploadSubtitle: {
        color: '#94a3b8',
        fontSize: '14px',
        marginBottom: '24px'
    },
    btnRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap'
    },
    btnSecondary: {
        padding: '12px 24px',
        backgroundColor: '#334155',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    btnPrimary: {
        padding: '12px 32px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    processingCard: {
        backgroundColor: '#1e293b',
        borderRadius: '20px',
        padding: '60px 40px',
        border: '1px solid #334155',
        textAlign: 'center'
    },
    progressContainer: {
        width: '120px',
        height: '120px',
        margin: '0 auto 24px',
        position: 'relative'
    },
    progressText: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ffffff'
    },
    progressBar: {
        width: '100%',
        maxWidth: '400px',
        height: '8px',
        backgroundColor: '#334155',
        borderRadius: '4px',
        margin: '24px auto',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        transition: 'width 0.5s ease'
    },
    resultsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    videoContainer: {
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        aspectRatio: '16/9'
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
    },
    kpiCard: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155',
        textAlign: 'center'
    },
    kpiIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px'
    },
    kpiValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '4px'
    },
    kpiLabel: {
        fontSize: '13px',
        color: '#94a3b8'
    },
    pieContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
    },
    legendDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%'
    },
    legendText: {
        color: '#ffffff',
        fontSize: '14px'
    },
    summaryItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #334155'
    },
    summaryLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    summaryText: {
        color: '#e2e8f0',
        fontSize: '14px'
    },
    summaryBadge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500'
    }
};

// Responsive styles
const mobileStyles = `
@media (max-width: 900px) {
    .results-grid { grid-template-columns: 1fr !important; }
    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (max-width: 600px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
}
`;

export default function VideoAnalysis() {
    const { token } = useAuth();
    const toast = useToast();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [results, setResults] = useState(null);
    const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const pollingRef = useRef(null);

    const pollStatus = useCallback(async (jId) => {
        try {
            const res = await fetch(`${API_BASE}/api/video/status/${jId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.status === "complete") {
                clearInterval(pollingRef.current);
                setProcessing(false);
                setProgress(100);
                setStatusMessage("اكتمل التحليل!");

                const resultRes = await fetch(`${API_BASE}/api/video/result/${jId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const resultData = await resultRes.json();

                setResults(resultData.results);
                setProcessedVideoUrl(`${API_BASE}${resultData.outputVideo}`);
                toast.success("نجاح", "تم تحليل الفيديو بنجاح!");
            } else if (data.status === "error") {
                clearInterval(pollingRef.current);
                setProcessing(false);
                toast.error("خطأ", data.message || "حدث خطأ أثناء التحليل");
            } else {
                setProgress(data.progress || 0);
                setStatusMessage(data.message || "جاري المعالجة...");
            }
        } catch (err) {
            console.error("Polling error:", err);
        }
    }, [token, toast]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]?.type.startsWith("video/")) {
            setFile(e.dataTransfer.files[0]);
        } else {
            toast.error("خطأ", "الرجاء اختيار ملف فيديو صالح");
        }
    };

    const onFileChange = (e) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleProcess = async () => {
        if (!file) return;

        setUploading(true);
        setResults(null);
        setProcessedVideoUrl(null);
        setProgress(0);
        setStatusMessage("جاري رفع الفيديو...");

        const formData = new FormData();
        formData.append("video", file);

        try {
            const res = await fetch(`${API_BASE}/api/video/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setUploading(false);
            setProcessing(true);
            setStatusMessage("جاري تحليل الفيديو بالذكاء الاصطناعي...");

            pollingRef.current = setInterval(() => {
                pollStatus(data.jobId);
            }, 2000);

        } catch (err) {
            setUploading(false);
            setProcessing(false);
            toast.error("خطأ", err.message || "حدث خطأ أثناء رفع الفيديو");
        }
    };

    const handleReset = () => {
        setFile(null);
        setResults(null);
        setProcessedVideoUrl(null);
        setProgress(0);
        setStatusMessage("");
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const activityData = results ? [
        { name: "نشط", value: results.activePercentage || 0, color: COLORS.emerald },
        { name: "غير نشط", value: results.inactivePercentage || 0, color: COLORS.amber }
    ] : [];

    // Upload State
    if (!results && !processing && !uploading) {
        return (
            <div style={styles.page}>
                <style>{mobileStyles}</style>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <div style={styles.title}>
                            <Video size={32} color={COLORS.blue} />
                            تحليل الفيديو بالذكاء الاصطناعي
                        </div>
                        <div style={styles.subtitle}>
                            ارفع مقطع فيديو لتحليل حركة الموظفين والعملاء تلقائياً باستخدام YOLOv8
                        </div>
                    </div>

                    <div
                        style={{ ...styles.uploadCard, ...(dragActive ? styles.uploadCardActive : {}) }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={onFileChange}
                            style={{ display: 'none' }}
                        />
                        <div style={styles.uploadIcon}>
                            <CloudUpload size={40} color={COLORS.blue} />
                        </div>
                        <div style={styles.uploadTitle}>
                            {file ? file.name : "اسحب ملف الفيديو هنا"}
                        </div>
                        <div style={styles.uploadSubtitle}>
                            أو اضغط لاختيار ملف من جهازك (MP4, MOV, AVI)
                        </div>
                        <div style={styles.btnRow}>
                            <button
                                style={styles.btnSecondary}
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                                <Upload size={18} /> اختيار ملف
                            </button>
                            {file && (
                                <button
                                    style={styles.btnPrimary}
                                    onClick={(e) => { e.stopPropagation(); handleProcess(); }}
                                >
                                    <Play size={18} /> بدء التحليل
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Processing State
    if (uploading || processing) {
        return (
            <div style={styles.page}>
                <style>{mobileStyles}</style>
                <div style={styles.container}>
                    <div style={styles.header}>
                        <div style={styles.title}>
                            <Video size={32} color={COLORS.blue} />
                            تحليل الفيديو بالذكاء الاصطناعي
                        </div>
                    </div>

                    <div style={styles.processingCard}>
                        <div style={styles.progressContainer}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke={COLORS.blue} strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${progress * 2.64} 264`} />
                            </svg>
                            <div style={styles.progressText}>{Math.round(progress)}%</div>
                        </div>
                        <div style={styles.uploadTitle}>{statusMessage}</div>
                        <div style={styles.uploadSubtitle}>هذا قد يستغرق بضع دقائق حسب طول الفيديو</div>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>YOLOv8 يحلل الفيديو...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Results State
    return (
        <div style={styles.page}>
            <style>{mobileStyles}</style>
            <div style={styles.container}>
                {/* Header with Reset Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <button style={styles.btnSecondary} onClick={handleReset}>
                        <RefreshCw size={16} /> تحليل فيديو جديد
                    </button>
                    <div style={{ ...styles.title, marginBottom: 0 }}>
                        <Video size={28} color={COLORS.emerald} />
                        نتائج التحليل
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid" style={styles.kpiGrid}>
                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIcon, backgroundColor: '#3b82f620' }}>
                            <Users size={24} color={COLORS.blue} />
                        </div>
                        <div style={styles.kpiValue}>{results.totalPeople}</div>
                        <div style={styles.kpiLabel}>إجمالي الأشخاص</div>
                    </div>
                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIcon, backgroundColor: '#8b5cf620' }}>
                            <ShieldCheck size={24} color={COLORS.purple} />
                        </div>
                        <div style={styles.kpiValue}>{results.staffCount}</div>
                        <div style={styles.kpiLabel}>طاقم العمل</div>
                    </div>
                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIcon, backgroundColor: '#10b98120' }}>
                            <UserCheck size={24} color={COLORS.emerald} />
                        </div>
                        <div style={styles.kpiValue}>{results.customerCount}</div>
                        <div style={styles.kpiLabel}>العملاء</div>
                    </div>
                    <div style={styles.kpiCard}>
                        <div style={{ ...styles.kpiIcon, backgroundColor: '#f59e0b20' }}>
                            <Clock size={24} color={COLORS.amber} />
                        </div>
                        <div style={styles.kpiValue}>{results.duration}</div>
                        <div style={styles.kpiLabel}>مدة الفيديو</div>
                    </div>
                </div>

                {/* Main Grid: Video + Activity */}
                <div className="results-grid" style={styles.resultsGrid}>
                    {/* Video Player */}


                    {/* Activity Pie Chart */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>
                            <Activity size={20} color={COLORS.emerald} />
                            نشاط الموظفين
                        </div>
                        <div style={styles.pieContainer}>
                            <div style={{ width: 180, height: 180 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={activityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                                            {activityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div style={styles.legendItem}>
                                    <div style={{ ...styles.legendDot, backgroundColor: COLORS.emerald }} />
                                    <span style={styles.legendText}>نشط: {results.activePercentage}%</span>
                                </div>
                                <div style={styles.legendItem}>
                                    <div style={{ ...styles.legendDot, backgroundColor: COLORS.amber }} />
                                    <span style={styles.legendText}>غير نشط: {results.inactivePercentage}%</span>
                                </div>
                                <div style={{ ...styles.legendItem, marginTop: '16px' }}>
                                    <Clock size={16} color="#94a3b8" />
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>المدة: {results.duration}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Chart */}
                {results.timeline && results.timeline.length > 0 && (
                    <div style={{ ...styles.card, marginBottom: '24px' }}>
                        <div style={styles.cardTitle}>
                            <BarChart3 size={20} color={COLORS.blue} />
                            الجدول الزمني
                        </div>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <AreaChart data={results.timeline}>
                                    <defs>
                                        <linearGradient id="colorStaff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="staff" name="الموظفين" stroke={COLORS.purple} strokeWidth={2} fill="url(#colorStaff)" />
                                    <Area type="monotone" dataKey="customers" name="العملاء" stroke={COLORS.emerald} strokeWidth={2} fill="url(#colorCustomers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Analysis Summary */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>
                        <CheckCircle2 size={20} color={COLORS.emerald} />
                        ملخص التحليل
                    </div>
                    <div style={styles.summaryItem}>
                        <div style={styles.summaryLeft}>
                            <CheckCircle2 size={16} color={COLORS.emerald} />
                            <span style={styles.summaryText}>تم اكتشاف {results.staffCount} موظف و {results.customerCount} عميل</span>
                        </div>
                        <span style={{ ...styles.summaryBadge, backgroundColor: '#10b98120', color: COLORS.emerald }}>مكتمل</span>
                    </div>
                    {results.activePercentage > 0 && (
                        <div style={styles.summaryItem}>
                            <div style={styles.summaryLeft}>
                                {results.activePercentage >= 70 ? (
                                    <CheckCircle2 size={16} color={COLORS.emerald} />
                                ) : (
                                    <AlertCircle size={16} color={COLORS.amber} />
                                )}
                                <span style={styles.summaryText}>نسبة نشاط الموظفين: {results.activePercentage}%</span>
                            </div>
                            <span style={{
                                ...styles.summaryBadge,
                                backgroundColor: results.activePercentage >= 70 ? '#10b98120' : '#f59e0b20',
                                color: results.activePercentage >= 70 ? COLORS.emerald : COLORS.amber
                            }}>
                                {results.activePercentage >= 70 ? 'ممتاز' : 'يحتاج تحسين'}
                            </span>
                        </div>
                    )}
                    {results.groups && results.groups.length > 0 && (
                        <div style={{ ...styles.summaryItem, borderBottom: 'none' }}>
                            <div style={styles.summaryLeft}>
                                <Users size={16} color={COLORS.amber} />
                                <span style={styles.summaryText}>تم اكتشاف {results.groups.length} مجموعة من العملاء</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
