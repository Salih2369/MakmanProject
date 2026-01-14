const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    city: { type: String, default: "الرياض" },
    cameras: { type: Number, default: 1 },
    status: { type: String, enum: ["ok", "warn"], default: "ok" },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", BranchSchema);
