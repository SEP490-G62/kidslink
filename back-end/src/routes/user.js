const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser,
  checkAvailability,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes

// Áp dụng xác thực và phân quyền School Admin cho toàn bộ user management
router.use(authenticate, authorize(['school_admin']));

// GET /api/users - Lấy danh sách users (có phân trang và filter)
router.get('/', getAllUsers);

// GET /api/users/:id - Lấy thông tin user theo ID
router.get('/:id', getUserById);

// POST /api/users/check-availability - kiểm tra trùng username/email
router.post('/check-availability', checkAvailability);

// POST /api/users - Tạo user mới
router.post('/', createUser);

// PUT /api/users/:id - Cập nhật user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Xóa user (soft delete)
router.delete('/:id', deleteUser);

// DELETE /api/users/:id/hard - Xóa user vĩnh viễn
router.delete('/:id/hard', hardDeleteUser);

// PUT /api/users/:id/restore - Khôi phục user đã bị xóa
router.put('/:id/restore', restoreUser);

module.exports = router;
