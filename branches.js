const express = require("express");
const auth = require("../middleware/auth");

const Branch = require("../models/Branch");

const router = express.Router();

async function seedIfEmpty(userId) {
  const count = await Branch.countDocuments({ userId });
  if (count > 0) return;

  await Branch.insertMany([
    { userId, name: "العليا", city: "الرياض", cameras: 12, status: "ok" },
    { userId, name: "النخيل", city: "الرياض", cameras: 8, status: "warn" },
    { userId, name: "الملز", city: "الرياض", cameras: 6, status: "ok" }
  ]);
}

router.get("/", auth, async (req, res) => {
  await seedIfEmpty(req.user.id);
  const branches = await Branch.find({ userId: req.user.id }).sort({ createdAt: -1 });
  const mapped = branches.map(b => ({
    id: b._id,
    name: b.name,
    city: b.city,
    cameras: b.cameras,
    status: b.status,
    lastSeen: "قبل قليل"
  }));
  res.json({ branches: mapped });
});

module.exports = router;
