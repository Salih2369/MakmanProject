/**
 * server.js
 * ----------
 * Express backend for Makman.
 * أضفت Route خاص بـ OpenRouter بدون ما أكسر بقية الراوتات.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// لو عندك DB:
const connectDB = require("./config/db");

const app = express();

// ====== Logger ======
app.use((req, res, next) => {
  console.log(`[API] ${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

// ====== DB ======
connectDB();

// ====== Middlewares ======
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limit (عام)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ====== Routes (مشروعك الحالي) ======
app.use("/api/users", require("./routes/users"));
app.use("/api", require("./routes/auth")); // login/register...
app.use("/api/branches", require("./routes/branches"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/video", require("./routes/video"));

// Serve static files from uploads folder
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve Desktop Project folder for Demo Video (User Request)
app.use('/demo-video', express.static('C:/Users/assad/Desktop/CapstoneProject'));

// ✅ NEW: OpenRouter proxy (يحمي الـ API Key)
app.use(
  "/api/openrouter",
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  require("./routes/openrouter")
);

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// 404 Catch-all (JSON)
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `الرابط ${req.method} ${req.url} غير موجود على هذا الخادم.`,
    path: req.url,
    method: req.method
  });
});

// ====== Error Handler ======
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: String(err?.message || err) });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
