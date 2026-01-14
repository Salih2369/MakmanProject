const express = require("express");
const auth = require("../middleware/auth");

const Alert = require("../models/Alert");

const router = express.Router();

// Seed demo alerts for new users (optional)
async function seedIfEmpty(userId) {
  const count = await Alert.countDocuments({ userId });
  if (count > 0) return;

  await Alert.insertMany([
    { userId, branch: "العليا", type: "AI", title: "نشاط غير اعتيادي", priority: "high" },
    { userId, branch: "النخيل", type: "OK", title: "ازدحام متوسط", priority: "medium" },
    { userId, branch: "الملز", type: "OK", title: "حركة طبيعية", priority: "low" }
  ]);
}

router.get("/", auth, async (req, res) => {
  await seedIfEmpty(req.user.id);
  const alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  const mapped = alerts.map(a => ({
    id: a._id,
    type: a.type,
    title: a.title,
    branch: a.branch,
    pr: a.priority,
    time: "قبل قليل"
  }));
  res.json({ alerts: mapped });
});

module.exports = router;
