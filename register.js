const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const { registerSchema } = require("./_validators");

router.post("/", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let { email, password } = value;
    email = email.trim().toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "المستخدم موجود مسبقاً" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      password: null,
      role: "manager",
      plan: "trial",
      onboardingComplete: false,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      token,
      user: {
        email: user.email,
        role: user.role,
        plan: user.plan,
        onboardingComplete: user.onboardingComplete,
      },
      message: "تم إنشاء الحساب بنجاح",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

module.exports = router;
