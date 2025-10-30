const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listDishes, listClassAges, listClassAgeMeals } = require('../controllers/nutritionController');

// Áp dụng xác thực và phân quyền cho toàn bộ route
router.use(authenticate, authorize(['nutrition_staff']));

// Danh sách món ăn
router.get('/dishes', listDishes);

// Danh sách nhóm tuổi
router.get('/class-ages', listClassAges);

// Danh sách lịch thực đơn theo nhóm tuổi (hỗ trợ query filter)
// GET /nutrition/class-age-meals?class_age_id=...&meal_id=...&date=YYYY-MM-DD
router.get('/class-age-meals', listClassAgeMeals);

module.exports = router;
