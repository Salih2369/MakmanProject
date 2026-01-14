import React, { useState, useEffect, useMemo, useRef } from "react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ArabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';
import { useToast } from "../components/ToastProvider";
import * as XLSX from "xlsx";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
    Users, Clock, UserCheck, Activity, TrendingUp, ArrowUpRight, ArrowDownRight,
    Calendar, BarChart3, Download, RefreshCw, FileSpreadsheet
} from "lucide-react";

// Color Palette
const COLORS = {
    blue: '#3b82f6',
    teal: '#14b8a6',
    amber: '#f59e0b',
    emerald: '#10b981',
    rose: '#f43f5e',
    purple: '#8b5cf6',
    indigo: '#6366f1'
};

// Helpers
const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':');
    // Treat "4:26" as 4.26 seconds (Primary Value)
    if (parts.length === 2) return parseFloat(`${parts[0]}.${parts[1]}`);
    if (parts.length === 3) return parseFloat(`${parts[0]}.${parts[1]}`); // Adjust if needed
    return parseFloat(timeStr) || 0;
};

const formatDuration = (seconds) => {
    return `${Math.round(seconds)} ثانية`; // Display as "X Seconds"
};

// Styled Components
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        padding: '24px',
        direction: 'rtl'
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '14px',
        marginTop: '4px'
    },
    exportBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    filtersCard: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #334155'
    },
    filtersRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center'
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    filterLabel: {
        color: '#94a3b8',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    filterBtnActive: {
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    filterBtn: {
        padding: '8px 16px',
        backgroundColor: '#334155',
        color: '#cbd5e1',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer'
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '24px'
    },
    kpiCard: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155'
    },
    kpiTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
    },
    kpiLabel: {
        color: '#94a3b8',
        fontSize: '14px',
        marginBottom: '8px'
    },
    kpiValue: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: 'bold'
    },
    kpiSub: {
        color: '#64748b',
        fontSize: '12px',
        marginTop: '4px'
    },
    kpiIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    kpiTrend: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '13px',
        marginTop: '12px',
        padding: '6px 10px',
        borderRadius: '6px',
        width: 'fit-content'
    },
    chartsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '24px'
    },
    chartCard: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155'
    },
    chartTitle: {
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    pieRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px'
    },
    legendDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%'
    },
    legendText: {
        color: '#94a3b8',
        fontSize: '13px'
    }
};

// Responsive styles for mobile
const mobileStyles = `
@media (max-width: 1200px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .charts-row { grid-template-columns: 1fr !important; }
    .pie-row { grid-template-columns: 1fr !important; }
}
@media (max-width: 600px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
}
`;

export default function AnalyticsDashboard() {
    const [customerData, setCustomerData] = useState([]);
    const [staffData, setStaffData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');
    const [performanceFilter, setPerformanceFilter] = useState('all');
    const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
    const toast = useToast();
    const areaChartRef = useRef(null);
    const topCustChartRef = useRef(null);
    const perfPieRef = useRef(null);
    const custTypePieRef = useRef(null);
    const activityChartRef = useRef(null);
    const avgActivityRef = useRef(null);
    const dashboardRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/report_sos9.xlsx');
                if (!response.ok) { loadDemo(); return; }
                const buffer = await response.arrayBuffer();
                const wb = XLSX.read(buffer, { type: 'array' });

                const custSheet = wb.Sheets['Customer Data'] || wb.Sheets[wb.SheetNames[0]];
                if (custSheet) {
                    setCustomerData(XLSX.utils.sheet_to_json(custSheet).map((r, i) => ({
                        id: r['Customer ID'] || r['ID'] || i + 1,
                        duration: timeToSeconds(r['Duration'] || r['Stay Duration'] || '0:00'),
                        groupType: r['Group Type'] || r['Type'] || 'individual',
                        groupSize: parseInt(r['Group Size'] || r['Size'] || 1)
                    })));
                }

                const staffSheet = wb.Sheets['Staff Data'] || wb.Sheets[wb.SheetNames[1]];
                if (staffSheet) {
                    setStaffData(XLSX.utils.sheet_to_json(staffSheet).map((r, i) => ({
                        id: r['Staff ID'] || r['ID'] || i + 1,
                        activeTime: timeToSeconds(r['Active Time'] || r['Active'] || '0:00'),
                        inactiveTime: timeToSeconds(r['Inactive Time'] || r['Inactive'] || '0:00'),
                        activityPercent: parseFloat(r['Activity %'] || r['Activity Percent'] || 0)
                    })).map(s => {
                        // Rescale to 10 seconds video duration
                        const total = s.activeTime + s.inactiveTime;
                        if (total > 0 && total !== 10) {
                            const factor = 10 / total;
                            s.activeTime = parseFloat((s.activeTime * factor).toFixed(2));
                            s.inactiveTime = parseFloat((s.inactiveTime * factor).toFixed(2));
                        }
                        return s;
                    }));
                }
                setLoading(false);
            } catch { loadDemo(); }
        };

        const loadDemo = () => {
            setCustomerData([
                { id: 1, duration: 4.5, groupType: 'individual', groupSize: 1 },
                { id: 2, duration: 3.2, groupType: 'group', groupSize: 3 },
                { id: 3, duration: 5.5, groupType: 'individual', groupSize: 1 },
                { id: 4, duration: 2.8, groupType: 'group', groupSize: 2 },
                { id: 5, duration: 7.0, groupType: 'individual', groupSize: 1 },
                { id: 6, duration: 4.8, groupType: 'group', groupSize: 4 },
                { id: 7, duration: 3.5, groupType: 'individual', groupSize: 1 },
                { id: 8, duration: 6.2, groupType: 'individual', groupSize: 1 },
            ]);
            setStaffData([
                { id: 1, activeTime: 8, inactiveTime: 2, activityPercent: 80 },
                { id: 2, activeTime: 6, inactiveTime: 4, activityPercent: 60 },
                { id: 3, activeTime: 9, inactiveTime: 1, activityPercent: 90 },
                { id: 4, activeTime: 5, inactiveTime: 5, activityPercent: 50 },
                { id: 5, activeTime: 7, inactiveTime: 3, activityPercent: 70 },
                { id: 6, activeTime: 3, inactiveTime: 7, activityPercent: 30 },
            ]);
            setLoading(false);
        };

        loadData();
    }, []);

    // Filtered data
    const filteredCustomers = useMemo(() => {
        let data = [...customerData];
        if (customerTypeFilter === 'individual') data = data.filter(c => c.groupType === 'individual');
        else if (customerTypeFilter === 'group') data = data.filter(c => c.groupType === 'group');
        return data;
    }, [customerData, customerTypeFilter]);

    const filteredStaff = useMemo(() => {
        let data = [...staffData];
        if (performanceFilter === 'high') data = data.filter(s => s.activityPercent >= 75);
        else if (performanceFilter === 'medium') data = data.filter(s => s.activityPercent >= 30 && s.activityPercent < 75);
        else if (performanceFilter === 'low') data = data.filter(s => s.activityPercent < 30);
        return data;
    }, [staffData, performanceFilter]);

    // KPIs
    const kpis = useMemo(() => ({
        totalCustomers: filteredCustomers.length,
        avgDuration: filteredCustomers.length > 0 ? filteredCustomers.reduce((s, c) => s + c.duration, 0) / filteredCustomers.length : 0,
        totalStaff: filteredStaff.length,
        avgActivity: filteredStaff.length > 0 ? filteredStaff.reduce((s, st) => s + st.activityPercent, 0) / filteredStaff.length : 0
    }), [filteredCustomers, filteredStaff]);

    // Chart data
    const durationData = useMemo(() => {
        const buckets = [
            { name: '0-2 ثانية', min: 0, max: 2, count: 0 },
            { name: '2-5 ثانية', min: 2, max: 5, count: 0 },
            { name: '5-10 ثانية', min: 5, max: 10, count: 0 },
            { name: '10+ ثانية', min: 10, max: Infinity, count: 0 }
        ];
        filteredCustomers.forEach(c => {
            const b = buckets.find(x => c.duration >= x.min && c.duration < x.max);
            if (b) b.count++;
        });
        return buckets.map(b => ({ name: b.name, عدد: b.count }));
    }, [filteredCustomers]);

    const topCustomers = useMemo(() => [...filteredCustomers]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(c => ({ name: `عميل ${c.id}`, المدة: Math.round(c.duration) }))
        , [filteredCustomers]);

    const perfData = useMemo(() => [
        { name: 'عالي الأداء', value: staffData.filter(s => s.activityPercent >= 75).length, color: COLORS.emerald },
        { name: 'متوسط', value: staffData.filter(s => s.activityPercent >= 30 && s.activityPercent < 75).length, color: COLORS.amber },
        { name: 'منخفض', value: staffData.filter(s => s.activityPercent < 30).length, color: COLORS.rose }
    ].filter(d => d.value > 0), [staffData]);

    const custTypeData = useMemo(() => [
        { name: 'فردي', value: customerData.filter(c => c.groupType === 'individual').length, color: COLORS.blue },
        { name: 'مجموعة', value: customerData.filter(c => c.groupType === 'group').length, color: COLORS.teal }
    ].filter(d => d.value > 0), [customerData]);

    const staffChartData = useMemo(() => filteredStaff.map(s => ({
        name: `موظف ${s.id}`,
        نشط: Math.round(s.activeTime),
        'غير نشط': Math.round(s.inactiveTime)
    })), [filteredStaff]);

    // Helper: Buffer to Base64
    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // Helper: Process Arabic with Bidi
    const processArabic = (text) => {
        if (!text) return "";
        const str = String(text);
        if (/[\u0600-\u06FF]/.test(str)) {
            try {
                // 1. Reshape
                const reshaped = ArabicReshaper.convertArabic(str);
                // 2. Bidi Reorder
                const bidi = bidiFactory();
                return bidi.getReorderedString(reshaped, { level: 'rtl' });
            } catch (e) { return str; }
        }
        return str;
    };

    const handleExport = async () => {
        try {
            toast.info("جاري إنشاء التقرير...", "جاري معالجة البيانات والخطوط...");

            // 1. Load Arabic Font safely
            const response = await fetch('/fonts/Amiri-Regular.ttf');
            if (!response.ok) throw new Error("فشل تحميل ملف الخط");
            const fontBuffer = await response.arrayBuffer();
            const fontBase64 = arrayBufferToBase64(fontBuffer);

            // 2. Init PDF
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // Register Font - Simplified Name
            doc.addFileToVFS("Amiri.ttf", fontBase64);
            doc.addFont("Amiri.ttf", "Amiri", "normal");
            doc.setFont("Amiri");

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 10;
            let y = 15;

            // 3. Header
            doc.setFontSize(22);
            doc.setTextColor(59, 130, 246); // Blue
            doc.text(processArabic("لوحة التحليلات - تقرير فيديو"), pageWidth - margin, y, { align: 'right' });

            y += 8;
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(processArabic(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`), pageWidth - margin, y, { align: 'right' });

            y += 15;

            // 4. KPI Section (Native)
            const kpiList = [
                { label: "إجمالي العملاء", value: kpis.totalCustomers, color: [59, 130, 246] },
                { label: "متوسط الإقامة", value: formatDuration(kpis.avgDuration), color: [16, 185, 129] },
                { label: "الموظفين", value: kpis.totalStaff, color: [245, 158, 11] },
                { label: "متوسط النشاط", value: `${Math.round(kpis.avgActivity)}%`, color: [244, 63, 94] }
            ];

            const kpiWidth = (pageWidth - (margin * 2) - 15) / 4;
            const kpiHeight = 25;

            kpiList.forEach((k, i) => {
                const x = pageWidth - margin - ((i + 1) * kpiWidth) - (i * 5);
                doc.setDrawColor(220);
                doc.setFillColor(255, 255, 255);
                doc.rect(x, y, kpiWidth, kpiHeight, 'FD');
                doc.setFillColor(...k.color);
                doc.rect(x + kpiWidth - 2, y, 2, kpiHeight, 'F');

                doc.setTextColor(80);
                doc.setFontSize(10);
                doc.text(processArabic(k.label), x + kpiWidth - 5, y + 8, { align: 'right' });

                doc.setTextColor(0);
                doc.setFontSize(14);
                // Ensure we stay on Amiri font, avoiding 'bold' which might reset to Helvetica if missing
                doc.setFont("Amiri", "normal");
                doc.text(processArabic(String(k.value)), x + kpiWidth - 5, y + 18, { align: 'right' });
                // Reset not needed as we strictly set it next time
            });

            y += 35;

            // 5. Capture Charts (Vector/Image)
            const capture = async (ref) => {
                if (!ref.current) return null;
                const c = await html2canvas(ref.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#1e293b' });
                return c.toDataURL('image/png');
            };

            // Row 1: Area + Top Customers
            const imgArea = await capture(areaChartRef);
            const imgTop = await capture(topCustChartRef);

            if (imgArea && imgTop) {
                doc.text(processArabic("تحليل مدة الإقامة"), pageWidth - margin, y, { align: 'right' });
                y += 5;
                doc.addImage(imgArea, 'PNG', margin, y, (pageWidth - 25) / 2, 50);
                doc.addImage(imgTop, 'PNG', margin + (pageWidth - 25) / 2 + 5, y, (pageWidth - 25) / 2, 50);
                y += 55;
            }

            // Row 2: Pies + Circular
            const imgPerf = await capture(perfPieRef);
            const imgType = await capture(custTypePieRef);
            const imgAvg = await capture(avgActivityRef);

            const w3 = (pageWidth - 30) / 3;
            if (imgPerf && imgType && imgAvg) {
                doc.addImage(imgAvg, 'PNG', margin, y, w3, 40);
                doc.addImage(imgType, 'PNG', margin + w3 + 5, y, w3, 40);
                doc.addImage(imgPerf, 'PNG', margin + (w3 * 2) + 10, y, w3, 40);
                y += 45;
            }

            // Row 3: Stacked Bar
            const imgStack = await capture(activityChartRef);
            if (imgStack) {
                doc.addImage(imgStack, 'PNG', margin, y, pageWidth - (margin * 2), 60);
                y += 65;
            }

            // 6. Data Tables (AutoTable)
            doc.addPage();
            doc.setFont('Amiri');
            doc.setFontSize(14);
            doc.text(processArabic("تفاصيل بيانات الموظفين"), pageWidth - margin, 20, { align: 'right' });

            autoTable(doc, {
                head: [['الحالة', 'نسبة النشاط', 'وقت الخمول', 'وقت النشاط', 'م'].map(h => processArabic(h))],
                body: staffData.map(s => [
                    s.id,
                    formatDuration(s.activeTime),
                    formatDuration(s.inactiveTime),
                    `${s.activityPercent}%`,
                    processArabic(s.activityPercent >= 75 ? 'ممتاز' : s.activityPercent >= 30 ? 'عادي' : 'منخفض')
                ]),
                startY: 25,
                styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
                headStyles: { fillColor: [59, 130, 246], halign: 'right', font: 'Amiri', fontStyle: 'normal' },
            });

            const finalY = doc.lastAutoTable.finalY + 15;
            doc.text(processArabic("تفاصيل العملاء (أعلى 10)"), pageWidth - margin, finalY, { align: 'right' });

            autoTable(doc, {
                head: [['الحجم', 'النوع', 'المدة الزمنية', 'م'].map(h => processArabic(h))],
                body: customerData.slice(0, 10).map(c => [
                    c.groupSize,
                    processArabic(c.groupType === 'group' ? 'مجموعة' : 'فردي'),
                    processArabic(formatDuration(c.duration)),
                    c.id
                ]),
                startY: finalY + 5,
                styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
                // Fix column splitting by forcing width or 'auto'
                columnStyles: {
                    0: { cellWidth: 20 }, // Size
                    1: { cellWidth: 25 }, // Type
                    2: { cellWidth: 25 }, // Duration
                    3: { cellWidth: 10 }  // ID
                },
                headStyles: { fillColor: [59, 130, 246], halign: 'right', font: 'Amiri', fontStyle: 'normal' },
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(processArabic(`صفحة ${i} من ${pageCount}`), pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            doc.save(`Professional_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success("تم التصدير بنجاح", "تم إنشاء ملف PDF الاحترافي");

        } catch (err) {
            console.error(err);
            toast.error("خطأ", "فشل التصدير. تأكد من تحميل الخطوط.");
        }
    };

    if (loading) {
        return (
            <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <RefreshCw size={40} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#94a3b8', marginTop: '16px' }}>جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    const FilterBtn = ({ active, onClick, children }) => (
        <button style={active ? styles.filterBtnActive : styles.filterBtn} onClick={onClick}>{children}</button>
    );

    return (
        <div style={styles.page}>
            <style>{mobileStyles}</style>
            <style>{mobileStyles}</style>
            <div style={styles.container} ref={dashboardRef}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <div style={styles.title}>
                            <FileSpreadsheet size={28} color="#3b82f6" />
                            لوحة التحليلات
                        </div>
                        <div style={styles.subtitle}>تحليل شامل لبيانات الفيديو والتقارير</div>
                    </div>
                    <button style={styles.exportBtn} onClick={handleExport}>
                        <Download size={18} />
                        تصدير التقرير
                    </button>
                </div>

                {/* Filters */}
                <div style={styles.filtersCard}>
                    <div style={styles.filtersRow}>
                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}><Calendar size={16} /> الفترة:</span>
                            <FilterBtn active={timeRange === 'today'} onClick={() => setTimeRange('today')}>اليوم</FilterBtn>
                            <FilterBtn active={timeRange === 'week'} onClick={() => setTimeRange('week')}>الأسبوع</FilterBtn>
                            <FilterBtn active={timeRange === 'all'} onClick={() => setTimeRange('all')}>الكل</FilterBtn>
                        </div>
                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}><Activity size={16} /> الأداء:</span>
                            <FilterBtn active={performanceFilter === 'all'} onClick={() => setPerformanceFilter('all')}>الكل</FilterBtn>
                            <FilterBtn active={performanceFilter === 'high'} onClick={() => setPerformanceFilter('high')}>عالي</FilterBtn>
                            <FilterBtn active={performanceFilter === 'medium'} onClick={() => setPerformanceFilter('medium')}>متوسط</FilterBtn>
                            <FilterBtn active={performanceFilter === 'low'} onClick={() => setPerformanceFilter('low')}>منخفض</FilterBtn>
                        </div>
                        <div style={styles.filterGroup}>
                            <span style={styles.filterLabel}><Users size={16} /> النوع:</span>
                            <FilterBtn active={customerTypeFilter === 'all'} onClick={() => setCustomerTypeFilter('all')}>الكل</FilterBtn>
                            <FilterBtn active={customerTypeFilter === 'individual'} onClick={() => setCustomerTypeFilter('individual')}>فردي</FilterBtn>
                            <FilterBtn active={customerTypeFilter === 'group'} onClick={() => setCustomerTypeFilter('group')}>مجموعة</FilterBtn>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid" style={styles.kpiGrid}>
                    {/* Customers */}
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTop}>
                            <div>
                                <div style={styles.kpiLabel}>إجمالي العملاء</div>
                                <div style={styles.kpiValue}>{kpis.totalCustomers}</div>
                                <div style={styles.kpiSub}>خلال الفترة المحددة</div>
                            </div>
                            <div style={{ ...styles.kpiIcon, backgroundColor: '#3b82f620' }}>
                                <Users size={24} color={COLORS.blue} />
                            </div>
                        </div>
                        <div style={{ ...styles.kpiTrend, backgroundColor: '#10b98120', color: COLORS.emerald }}>
                            <ArrowUpRight size={14} /> +12% من الأسبوع الماضي
                        </div>
                    </div>

                    {/* Duration */}
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTop}>
                            <div>
                                <div style={styles.kpiLabel}>متوسط مدة الإقامة</div>
                                <div style={styles.kpiValue}>{formatDuration(kpis.avgDuration)}</div>
                                <div style={styles.kpiSub}>بالثواني</div>
                            </div>
                            <div style={{ ...styles.kpiIcon, backgroundColor: '#14b8a620' }}>
                                <Clock size={24} color={COLORS.teal} />
                            </div>
                        </div>
                        <div style={{ ...styles.kpiTrend, backgroundColor: '#10b98120', color: COLORS.emerald }}>
                            <ArrowUpRight size={14} /> +5% تحسن
                        </div>
                    </div>

                    {/* Staff */}
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTop}>
                            <div>
                                <div style={styles.kpiLabel}>إجمالي الموظفين</div>
                                <div style={styles.kpiValue}>{kpis.totalStaff}</div>
                                <div style={styles.kpiSub}>قيد المتابعة</div>
                            </div>
                            <div style={{ ...styles.kpiIcon, backgroundColor: '#8b5cf620' }}>
                                <UserCheck size={24} color={COLORS.purple} />
                            </div>
                        </div>
                    </div>

                    {/* Activity */}
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTop}>
                            <div>
                                <div style={styles.kpiLabel}>متوسط النشاط</div>
                                <div style={styles.kpiValue}>{Math.round(kpis.avgActivity)}%</div>
                                <div style={styles.kpiSub}>نسبة الإنتاجية</div>
                            </div>
                            <div style={{ ...styles.kpiIcon, backgroundColor: '#10b98120' }}>
                                <Activity size={24} color={COLORS.emerald} />
                            </div>
                        </div>
                        <div style={{
                            ...styles.kpiTrend,
                            backgroundColor: kpis.avgActivity >= 60 ? '#10b98120' : '#f43f5e20',
                            color: kpis.avgActivity >= 60 ? COLORS.emerald : COLORS.rose
                        }}>
                            {kpis.avgActivity >= 60 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {kpis.avgActivity >= 60 ? 'أداء جيد' : 'يحتاج تحسين'}
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="charts-row" style={styles.chartsRow}>
                    <div style={styles.chartCard} ref={areaChartRef}>
                        <div style={styles.chartTitle}>
                            <BarChart3 size={20} color={COLORS.blue} />
                            توزيع مدة الإقامة
                        </div>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <AreaChart data={durationData}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="عدد" stroke={COLORS.blue} strokeWidth={2} fill="url(#areaGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={styles.chartCard} ref={topCustChartRef}>
                        <div style={styles.chartTitle}>
                            <TrendingUp size={20} color={COLORS.teal} />
                            أطول مدة إقامة (أعلى 5)
                        </div>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <BarChart data={topCustomers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={60} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${v} ثانية`, 'المدة']} />
                                    <Bar dataKey="المدة" fill={COLORS.teal} radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Charts Row */}
                <div className="pie-row" style={styles.pieRow}>
                    <div style={styles.chartCard} ref={perfPieRef}>
                        <div style={styles.chartTitle}>توزيع أداء الموظفين</div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={perfData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                                        {perfData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {perfData.map((d, i) => (
                                <div key={i} style={styles.legendItem}>
                                    <div style={{ ...styles.legendDot, backgroundColor: d.color }}></div>
                                    <span style={styles.legendText}>{d.name}: {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.chartCard} ref={custTypePieRef}>
                        <div style={styles.chartTitle}>نوع العملاء</div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={custTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                                        {custTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {custTypeData.map((d, i) => (
                                <div key={i} style={styles.legendItem}>
                                    <div style={{ ...styles.legendDot, backgroundColor: d.color }}></div>
                                    <span style={styles.legendText}>{d.name}: {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.chartCard} ref={avgActivityRef}>
                        <div style={styles.chartTitle}>النشاط الكلي</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
                                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke={COLORS.emerald} strokeWidth="10" strokeLinecap="round"
                                            strokeDasharray={`${kpis.avgActivity * 2.64} 264`} />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{Math.round(kpis.avgActivity)}%</span>
                                    </div>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>متوسط نشاط الموظفين</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staff Activity Chart */}
                <div style={styles.chartCard} ref={activityChartRef}>
                    <div style={styles.chartTitle}>
                        <BarChart3 size={20} color={COLORS.rose} />
                        تفصيل نشاط الموظفين
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={staffChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${v} ثانية`]} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                <Bar dataKey="نشط" stackId="a" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="غير نشط" stackId="a" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '13px' }}>
                    تم إنشاء هذا التقرير تلقائياً بواسطة نظام مكمن للتحليلات الذكية
                </div>
            </div>
        </div>
    );
}
