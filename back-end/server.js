import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import adminRoutes from "./src/routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🧱 Middleware bảo mật
app.use(helmet());

// 🌐 CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ⚙️ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: "Quá nhiều requests từ IP này, vui lòng thử lại sau.",
});
app.use(limiter);

// 🧾 Logging
app.use(morgan("combined"));

// 🧍 Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 📂 Static files
app.use("/uploads", express.static("uploads"));

// 🧠 Kết nối Database
connectDB();

// ✅ Routes
app.get("/", (req, res) => {
  res.json({
    message: "Chào mừng đến với KidsLink API!",
    version: "1.0.0",
    status: "running",
  });
});

// 💓 Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 📡 API routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", (await import("./src/routes/auth.js")).default);
app.use("/api/users", (await import("./src/routes/user.js")).default);

// ❌ 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint không tồn tại",
    message: `Không tìm thấy ${req.originalUrl}`,
  });
});

// 💥 Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Lỗi server nội bộ",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Có lỗi xảy ra, vui lòng thử lại sau",
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
