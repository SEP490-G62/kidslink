const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listDishes, createDish, updateDish, deleteDish, listClassAges, listClassAgeMeals, listMeals, listWeekDays, listClassesForNutrition, getStudentsByClass, getStudentsByClassAge, assignDishesToClassAgeMeal, getAssignedDishes, getWeeklyAssignedDishes, getStaffProfile, updateStaffProfile, changeStaffPassword } = require('../controllers/nutritionController');

// Áp dụng xác thực và phân quyền cho toàn bộ route
router.use(authenticate, authorize(['nutrition_staff']));

// Danh sách món ăn
router.get('/dishes', listDishes);
router.post('/dishes', createDish);
router.put('/dishes/:id', updateDish);
router.delete('/dishes/:id', deleteDish);

// Danh sách nhóm tuổi
router.get('/class-ages', listClassAges);

// Danh sách lớp và học sinh để kiểm tra dị ứng
router.get('/classes', listClassesForNutrition);
router.get('/classes/:classId/students', getStudentsByClass);
router.get('/class-ages/:classAgeId/students', getStudentsByClassAge);

// Danh sách lịch thực đơn theo nhóm tuổi (hỗ trợ query filter)
// GET /nutrition/class-age-meals?class_age_id=...&meal_id=...&date=YYYY-MM-DD
router.get('/class-age-meals', listClassAgeMeals);

// Danh sách bữa ăn và ngày trong tuần
router.get('/meals', listMeals);
router.get('/weekdays', listWeekDays);

// Gán món ăn cho một ngày/bữa của một nhóm tuổi
router.post('/class-age-meals/assign', assignDishesToClassAgeMeal);

// Lấy món ăn đã gán cho một ngày/bữa của một nhóm tuổi
router.get('/class-age-meals/dishes', getAssignedDishes);

// Lấy tất cả món đã gán cho một tuần (batch endpoint)
router.get('/class-age-meals/weekly-dishes', getWeeklyAssignedDishes);

// Thông tin cá nhân Nutrition Staff
router.get('/profile', getStaffProfile);
router.put('/profile', updateStaffProfile);
router.put('/change-password', changeStaffPassword);

module.exports = router;
