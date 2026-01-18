require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const dealerRoutes = require("./routes/dealers");
const bulkRoutes = require("./routes/bulk");
const contactRoutes = require("./routes/contact");
const uploadRoutes = require("./routes/upload");
const categoryRoutes = require("./routes/categories");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middlewares
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ✅ Build allowlist from ENV
function normalizeOrigin(url) {
  if (!url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url.replace(/\/$/, ""); // default to https
  }
  return url.replace(/\/$/, ""); // remove trailing slash
}

const allowlist = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map(s => normalizeOrigin(s.trim()))
  .filter(Boolean);

console.log("✅ CORS Allowlist:", allowlist);

if (process.env.RESEND_API_KEY) {
  console.log("✅ RESEND_API_KEY loaded");
} else {
  console.error("❌ Missing RESEND_API_KEY");
}
if (process.env.RESEND_FROM) {
  console.log("✅ RESEND_FROM set to:", process.env.RESEND_FROM);
} else {
  console.error("❌ Missing RESEND_FROM");
}
if (process.env.NOTIFY_EMAIL) {
  console.log("✅ Admin notifications to:", process.env.NOTIFY_EMAIL);
} else {
  console.warn("⚠️ Admin notifications disabled (NOTIFY_EMAIL not set)");
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow same-origin / server-to-server
      const normalizedOrigin = normalizeOrigin(origin);
      const ok = allowlist.includes(normalizedOrigin);
      if (ok) return cb(null, true);

      console.error("❌ CORS blocked request from:", origin);
      cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);

// Lightweight health endpoint (no cache)
app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ success: true, status: "ok", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server started on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error("❌ DB connect error", err);
    process.exit(1);
  });
