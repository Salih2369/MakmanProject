const express = require("express");
const Subscription = require("../models/Subscription");
const auth = require("../middleware/auth");

const router = express.Router();

const PLAN_MAP = {
  "الباقة التجريبية": "trial",
  "باقة الأعمال": "business",
  "باقة الشركات": "enterprise",
  "باقة المؤسسات": "enterprise",

  trial: "trial",
  business: "business",
  enterprise: "enterprise",
};

function normalizePlan(input) {
  const p = (input || "").trim();
  return PLAN_MAP[p] || null;
}

// POST /api/subscriptions/select
router.post("/select", auth, async (req, res) => {
  try {
    const plan = normalizePlan(req.body.plan);
    if (!plan) return res.status(400).json({ error: "خطة غير معروفة" });

    const userId = req.user.id;

    // upsert: إذا موجود اشتراك يحدثه، إذا لا ينشئه
    const sub = await Subscription.findOneAndUpdate(
      { userId },
      { plan, status: "active", startedAt: new Date(), endsAt: null },
      { new: true, upsert: true }
    );

    return res.json({ message: "تم تحديث الاشتراك", subscription: sub });
  } catch (e) {
    console.error("subscriptions/select error:", e);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
