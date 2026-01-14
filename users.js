const express = require("express");
const auth = require("../middleware/auth");

const User = require("../models/User");
const { onboardingSchema, settingsSchema, roleSchema, profileSchema } = require("./_validators");

const router = express.Router();

async function requireAdmin(req, res, next) {
  const u = await User.findById(req.user.id).select("role");
  if (!u) return res.status(404).json({ error: "User not found" });
  if (u.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  req.userRole = u.role;
  next();
}

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  const u = await User.findById(req.user.id).select("-passwordHash");
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ user: u });
});

// PUT /api/users/me/onboarding
router.put("/me/onboarding", auth, async (req, res) => {
  const { error, value } = onboardingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { ...value, onboardingComplete: true },
    { new: true }
  ).select("-passwordHash");

  res.json({ user: updated, message: "تم حفظ بيانات التهيئة" });
});

// PUT /api/users/me/settings
router.put("/me/settings", auth, async (req, res) => {
  const { error, value } = settingsSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const updated = await User.findByIdAndUpdate(req.user.id, value, { new: true }).select("-passwordHash");
  res.json({ user: updated, message: "تم حفظ الإعدادات" });
});

// PUT /api/users/me/profile
router.put("/me/profile", auth, async (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const updated = await User.findByIdAndUpdate(req.user.id, value, { new: true }).select("-passwordHash");
  res.json({ user: updated, message: "تم تحديث الملف الشخصي" });
});

// ADMIN: list users
router.get("/", auth, requireAdmin, async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json({ users });
});

// ADMIN: update role
router.put("/:id/role", auth, requireAdmin, async (req, res) => {
  const { error, value } = roleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: "Invalid role" });

  const updated = await User.findByIdAndUpdate(req.params.id, { role: value.role }, { new: true }).select("-passwordHash");
  res.json({ user: updated });
});

module.exports = router;
