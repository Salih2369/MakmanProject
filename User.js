const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    // ✅ الجديد (آمن)
    passwordHash: { type: String, default: null },

    // ✅ دعم قديم (لو عندك مستخدمين متخزنين plaintext)
    password: { type: String, default: null },

    // (اختياري إذا عندك)
    role: { type: String, enum: ["admin", "manager", "viewer"], default: "manager" },
    plan: { type: String, enum: ["trial", "business", "enterprise"], default: "trial" },
    onboardingComplete: { type: Boolean, default: false },
    companyName: { type: String, default: "" },

    // ✅ البروفايل (جديد)
    fullName: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
