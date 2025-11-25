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
  getCurrentUser,
  updateCurrentUser,
  changePassword
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Các API dành cho người dùng hiện tại (áp dụng cho mọi vai trò đã đăng nhập)
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateCurrentUser);
router.put('/change-password', authenticate, changePassword);

// Các API quản trị user dành riêng cho School Admin & Admin
router.use(authenticate, authorize(['school_admin', 'admin']));

// GET /api/users - Lấy danh sách users (có phân trang và filter)
router.get('/', getAllUsers);

// GET /api/users/:id - Lấy thông tin user theo ID
router.get('/:id', getUserById);

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

