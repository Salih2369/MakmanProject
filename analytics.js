const express = require("express");
const auth = require("../middleware/auth");
const Branch = require("../models/Branch");
const Alert = require("../models/Alert");

const router = express.Router();

// GET /api/analytics/summary
router.get("/summary", auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch branches
        const branches = await Branch.find({ userId });
        // Fetch recent alerts
        const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).limit(10);

        let summary = "ملخص الأعمال الحالي:\n\n";

        if (branches.length > 0) {
            summary += "الفروع:\n";
            branches.forEach((b) => {
                summary += `- فرع ${b.name} (${b.city}): الحالة ${b.status}, عدد الكاميرات ${b.cameras}\n`;
            });
        } else {
            summary += "لا يوجد فروع مسجلة حالياً.\n";
        }

        summary += "\nآخر التنبيهات:\n";
        if (alerts.length > 0) {
            alerts.forEach((a) => {
                summary += `- [${a.priority}] ${a.title} في فرع ${a.branch}\n`;
            });
        } else {
            summary += "لا توجد تنبيهات حديثة.\n";
        }

        res.json({ summary });
    } catch (err) {
        console.error("Analytics summary error:", err);
        res.status(500).json({ error: "خطأ في جلب بيانات التحليلات" });
    }
});

module.exports = router;
