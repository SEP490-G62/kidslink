const mongoose = require('mongoose');
const { Dish, ClassAge, ClassAgeMeal, Meal, WeekDay, DishesClassAgeMeal, User } = require('../models');

// Lấy danh sách tất cả món ăn
exports.listDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ dish_name: 1 });
    res.json({ count: dishes.length, dishes });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Tạo mới món ăn
exports.createDish = async (req, res) => {
  try {
    const { dish_name, description } = req.body || {};
    if (!dish_name || !description) {
      return res.status(400).json({ error: 'Thiếu dish_name hoặc description' });
    }
    const created = await Dish.create({ dish_name, description });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Cập nhật món ăn
exports.updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { dish_name, description } = req.body || {};
    if (!dish_name && !description) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }
    const updated = await Dish.findByIdAndUpdate(
      id,
      { $set: { ...(dish_name ? { dish_name } : {}), ...(description ? { description } : {}) } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn' });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Xoá món ăn
exports.deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Dish.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn' });
    }
    return res.status(204).json({});
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách tất cả nhóm tuổi
exports.listClassAges = async (req, res) => {
  try {
    const ages = await ClassAge.find().sort({ age: 1 });
    res.json({ count: ages.length, classAges: ages });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách classAgeMeal, có thể filter theo class_age_id, meal_id, date
exports.listClassAgeMeals = async (req, res) => {
  try {
    const filter = {};
    const { class_age_id, meal_id, date } = req.query;
    if (class_age_id) filter.class_age_id = class_age_id;
    if (meal_id) filter.meal_id = meal_id;
    if (date) filter.date = new Date(date);
    const docs = await ClassAgeMeal.find(filter)
      .populate('class_age_id')
      .populate('meal_id')
      .populate('weekday_id')
      .sort({ date: -1 });
    res.json({ count: docs.length, classAgeMeals: docs });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách bữa ăn (Meal)
exports.listMeals = async (req, res) => {
  try {
    const meals = await Meal.find().sort({ meal: 1 });
    res.json({ count: meals.length, meals });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách các ngày trong tuần (WeekDay)
exports.listWeekDays = async (req, res) => {
  try {
    const days = await WeekDay.find().sort({ createdAt: 1 });
    res.json({ count: days.length, weekDays: days });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Gán danh sách món ăn cho một ClassAgeMeal (một ngày + một bữa của một nhóm tuổi)
// Body: { class_age_id, meal_id, weekday_id, date, dish_ids: [] }
exports.assignDishesToClassAgeMeal = async (req, res) => {
  try {
    const { class_age_id, meal_id, weekday_id, date, dish_ids } = req.body;

    if (!class_age_id || !meal_id || !weekday_id || !date || !Array.isArray(dish_ids)) {
      return res.status(400).json({ error: 'Thiếu tham số yêu cầu' });
    }

    // Validate refs existence (lightweight)
    const [classAgeExists, mealExists, weekdayExists] = await Promise.all([
      ClassAge.exists({ _id: class_age_id }),
      Meal.exists({ _id: meal_id }),
      WeekDay.exists({ _id: weekday_id })
    ]);

    if (!classAgeExists || !mealExists || !weekdayExists) {
      return res.status(400).json({ error: 'Tham chiếu không hợp lệ' });
    }

    const normalizedDate = new Date(date);

    // Tìm hoặc tạo ClassAgeMeal
    let classAgeMeal = await ClassAgeMeal.findOne({ class_age_id, meal_id, weekday_id, date: normalizedDate });
    if (!classAgeMeal) {
      classAgeMeal = await ClassAgeMeal.create({ class_age_id, meal_id, weekday_id, date: normalizedDate });
    }

    // Đồng bộ bảng nối DishesClassAgeMeal theo danh sách dish_ids
    const currentMappings = await DishesClassAgeMeal.find({ class_age_meal_id: classAgeMeal._id });
    const currentDishIds = new Set(currentMappings.map((m) => String(m.dish_id)));
    const nextDishIds = new Set(dish_ids.map(String));

    // Xoá những món không còn được chọn
    const toDelete = [...currentDishIds].filter((id) => !nextDishIds.has(id));
    if (toDelete.length) {
      await DishesClassAgeMeal.deleteMany({ class_age_meal_id: classAgeMeal._id, dish_id: { $in: toDelete } });
    }

    // Thêm những món mới được chọn
    const toInsert = [...nextDishIds].filter((id) => !currentDishIds.has(id));
    if (toInsert.length) {
      await DishesClassAgeMeal.insertMany(
        toInsert.map((dishId) => ({ class_age_meal_id: classAgeMeal._id, dish_id: dishId }))
      );
    }

    const populated = await ClassAgeMeal.findById(classAgeMeal._id)
      .populate('class_age_id')
      .populate('meal_id')
      .populate('weekday_id');
    const dishes = await DishesClassAgeMeal.find({ class_age_meal_id: classAgeMeal._id }).populate('dish_id');

    return res.json({
      success: true,
      classAgeMeal: populated,
      dishes: dishes.map((d) => d.dish_id)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Bị trùng dữ liệu món ăn' });
    }
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách món đã gán cho một ClassAgeMeal theo tiêu chí
// Query: class_age_id, meal_id, weekday_id, date
exports.getAssignedDishes = async (req, res) => {
  try {
    const { class_age_id, meal_id, weekday_id, date } = req.query;
    if (!class_age_id || !meal_id || !weekday_id || !date) {
      return res.status(400).json({ error: 'Thiếu tham số yêu cầu' });
    }
    const normalizedDate = new Date(date);
    const classAgeMeal = await ClassAgeMeal.findOne({ class_age_id, meal_id, weekday_id, date: normalizedDate });
    if (!classAgeMeal) {
      return res.json({ dishes: [] });
    }
    const mappings = await DishesClassAgeMeal.find({ class_age_meal_id: classAgeMeal._id }).populate('dish_id');
    return res.json({
      classAgeMealId: classAgeMeal._id,
      dishes: mappings.map((m) => m.dish_id)
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// --- Nutrition Staff Profile ---
// GET /nutrition/profile
exports.getStaffProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId).select('-password_hash');
    if (!user || user.role !== 'nutrition_staff') {
      return res.status(403).json({ error: 'Không đúng vai trò nutrition staff' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// PUT /nutrition/profile
exports.updateStaffProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId);
    if (!user || user.role !== 'nutrition_staff') {
      return res.status(403).json({ error: 'Không đúng vai trò nutrition staff' });
    }
    const { full_name, avatar_url, email, phone_number, password } = req.body || {};
    if (full_name !== undefined) user.full_name = full_name;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (email !== undefined) user.email = email;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (password) user.password_hash = await require('bcryptjs').hash(password, 12);
    await user.save();
    return res.json({ message: 'Cập nhật profile thành công', user: await User.findById(userId).select('-password_hash') });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};
