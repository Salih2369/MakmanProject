const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

function flagsByPlan(plan) {
  if (plan === "باقة المؤسسات") {
    return { demo: true, settings: true, alerts: true, exportReports: true, usersAdmin: true, branches: true, reports: true };
  }
  if (plan === "باقة الأعمال") {
    return { demo: true, settings: true, alerts: true, exportReports: true, usersAdmin: false, branches: true, reports: true };
  }
  return { demo: true, settings: true, alerts: true, exportReports: false, usersAdmin: false, branches: false, reports: false };
}

router.get("/me", auth, async (req, res) => {
  const u = await User.findById(req.user.id).select("plan role");
  const plan = u?.plan || "الباقة التجريبية";
  res.json({ flags: flagsByPlan(plan), plan, role: u?.role || "viewer" });
});

module.exports = router;
