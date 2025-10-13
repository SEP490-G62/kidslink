const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Routes

// GET /api/users - Lấy danh sách users (có phân trang và filter)
router.get('/', authenticate, getAllUsers);

// GET /api/users/:id - Lấy thông tin user theo ID
router.get('/:id', authenticate, getUserById);

// POST /api/users - Tạo user mới
router.post('/', authenticate, createUser);

// PUT /api/users/:id - Cập nhật user
router.put('/:id', authenticate, updateUser);

// DELETE /api/users/:id - Xóa user (soft delete)
router.delete('/:id', authenticate, deleteUser);

// DELETE /api/users/:id/hard - Xóa user vĩnh viễn
router.delete('/:id/hard', authenticate, hardDeleteUser);

// PUT /api/users/:id/restore - Khôi phục user đã bị xóa
router.put('/:id/restore', authenticate, restoreUser);

module.exports = router;
