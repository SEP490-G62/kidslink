const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const router = require("./src/routes/index.js");
const connectDB = require('./src/config/database');
const { initializeSocket } = require('./src/utils/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Khởi tạo Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Tăng giới hạn kích thước gói để nhận ảnh lớn hơn (mặc định ~1MB)
  maxHttpBufferSize: 20 * 1024 * 1024 // 20MB
});

// Khởi tạo socket handlers
initializeSocket(io);

// Middleware bảo mật
app.use(helmet());

// CORS configuration with whitelist (supports multiple dev origins)
const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const envOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests or same-origin without Origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked: origin ${origin} not in whitelist: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn 100 requests per windowMs
  message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Kết nối Database
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với KidsLink API!',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use("/", router);
// app.use('/api/kids', require('./routes/kids'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint không tồn tại',
    message: `Không tìm thấy ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Lỗi server nội bộ',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Có lỗi xảy ra, vui lòng thử lại sau'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log(`🔐 CORS allowed origins: ${allowedOrigins.join(', ') || 'none'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO đã sẵn sàng`);
});

module.exports = { app, server, io };
