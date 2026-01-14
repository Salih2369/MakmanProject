const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    branch: { type: String, required: true },
    type: { type: String, enum: ["AI", "OK"], default: "OK" },
    title: { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "low" },
    at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
