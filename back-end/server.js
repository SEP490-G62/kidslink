const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware bảo mật
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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

// API routes sẽ được thêm vào đây
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/user'));
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
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
