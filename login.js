const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { loginSchema } = require("./_validators");

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;
    const emailNorm = email.trim().toLowerCase();
    const passNorm = password.trim();

    const emailRegex = new RegExp("^\\s*" + escapeRegex(emailNorm) + "\\s*$", "i");
    const user = await User.findOne({ email: emailRegex });

    if (!user) return res.status(400).json({ error: "بيانات الدخول غير صحيحة" });

    // ✅ يدعم الجديد (hash) والقديم (plaintext)
    let ok = false;

    if (user.passwordHash) {
      ok = await bcrypt.compare(passNorm, user.passwordHash);
    } else if (user.password) {
      ok = passNorm === String(user.password).trim();

      // ✅ ترقية تلقائية: نحول حسابات plaintext إلى hash بعد أول دخول ناجح
      if (ok) {
        user.passwordHash = await bcrypt.hash(passNorm, 10);
        user.password = null;
        await user.save();
      }
    } else {
      return res.status(400).json({ error: "الحساب غير مكتمل (لا توجد كلمة مرور)" });
    }

    if (!ok) return res.status(400).json({ error: "بيانات الدخول غير صحيحة" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Missing JWT_SECRET in .env" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        plan: user.plan,
        onboardingComplete: user.onboardingComplete,
        companyName: user.companyName,
      },
      message: "تم تسجيل الدخول بنجاح",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

module.exports = router;
