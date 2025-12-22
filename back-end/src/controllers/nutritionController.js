const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Dish, ClassAge, ClassAgeMeal, Meal, WeekDay, DishesClassAgeMeal, User, Class, StudentClass, Student } = require('../models');

// Helper function để lấy school_id từ user
const getUserSchoolId = async (req) => {
  const userId = req?.user?.id;
  if (!userId) return null;
  const user = await User.findById(userId).select('school_id');
  return user?.school_id || null;
};

const normalizeStudent = (studentDoc = {}) => {
  if (!studentDoc) return null;
  return {
    _id: studentDoc._id,
    full_name: studentDoc.full_name,
    avatar_url: studentDoc.avatar_url,
    dob: studentDoc.dob,
    gender: studentDoc.gender,
    allergy: studentDoc.allergy || '',
    status: studentDoc.status,
    school_id: studentDoc.school_id
  };
};

// --- Meal CRUD ---
// Lấy danh sách bữa ăn (Meal) dùng chung cho mọi trường
exports.listMeals = async (req, res) => {
  try {
    const meals = await Meal.find().sort({ meal: 1 });
    res.json({ count: meals.length, meals });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// --- Dish CRUD ---
// Lấy danh sách tất cả món ăn theo school_id
exports.listDishes = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const dishes = await Dish.find({ school_id: schoolId })
      .populate('category')
      .sort({ dish_name: 1 });
    res.json({ count: dishes.length, dishes });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Tạo mới món ăn
exports.createDish = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { dish_name, description, category } = req.body || {};
    if (!dish_name || !description || !category || !Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ error: 'Thiếu dish_name, description hoặc category (phải là array không rỗng)' });
    }
    // Validate tất cả category tồn tại
    const meals = await Meal.find({ _id: { $in: category } });
    if (meals.length !== category.length) {
      return res.status(400).json({ error: 'Một số category không hợp lệ' });
    }
    const created = await Dish.create({ dish_name, description, category, school_id: schoolId });
    const populated = await Dish.findById(created._id).populate('category');
    return res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'category không đúng định dạng ObjectId' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Cập nhật món ăn
exports.updateDish = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { id } = req.params;
    const { dish_name, description, category } = req.body || {};
    if (!dish_name && !description && !category) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }
    // Kiểm tra dish có tồn tại và cùng school_id
    const existing = await Dish.findOne({ _id: id, school_id: schoolId });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn hoặc không có quyền truy cập' });
    }
    // Validate category nếu có cập nhật
    if (category) {
      if (!Array.isArray(category) || category.length === 0) {
        return res.status(400).json({ error: 'category phải là array không rỗng' });
      }
      const meals = await Meal.find({ _id: { $in: category } });
      if (meals.length !== category.length) {
        return res.status(400).json({ error: 'Một số category không hợp lệ' });
      }
    }
    const updateData = {};
    if (dish_name) updateData.dish_name = dish_name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    const updated = await Dish.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate('category');
    return res.json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'category không đúng định dạng ObjectId' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Xoá món ăn
exports.deleteDish = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { id } = req.params;
    const existing = await Dish.findOne({ _id: id, school_id: schoolId });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn hoặc không có quyền truy cập' });
    }
    await Dish.findByIdAndDelete(id);
    return res.status(204).json({});
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// --- ClassAge ---
// Lấy danh sách tất cả nhóm tuổi theo school_id
exports.listClassAges = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const ages = await ClassAge.find({ school_id: schoolId }).sort({ age: 1 });
    res.json({ count: ages.length, classAges: ages });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy danh sách classAgeMeal, có thể filter theo class_age_id, meal_id, date
exports.listClassAgeMeals = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const filter = {};
    const { class_age_id, meal_id, date } = req.query;
    if (class_age_id) filter.class_age_id = class_age_id;
    if (meal_id) filter.meal_id = meal_id;
    if (date) filter.date = new Date(date);
    
    // Populate và filter theo school_id
    const docs = await ClassAgeMeal.find(filter)
      .populate({
        path: 'class_age_id',
        match: { school_id: schoolId }
      })
      .populate('meal_id')
      .populate('weekday_id')
      .sort({ date: -1 });
    
    // Filter out null values from populate
    const filteredDocs = docs.filter(doc => doc.class_age_id && doc.meal_id);
    
    res.json({ count: filteredDocs.length, classAgeMeals: filteredDocs });
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

// Danh sách lớp theo school + classAge (giúp nutrition staff xem học sinh)
exports.listClassesForNutrition = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { class_age_id } = req.query || {};
    const filter = { school_id: schoolId };
    if (class_age_id) {
      filter.class_age_id = class_age_id;
    }
    const classes = await Class.find(filter)
      .populate('class_age_id')
      .sort({ class_name: 1 });
    return res.json({ count: classes.length, classes });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Danh sách học sinh theo lớp (kèm thông tin dị ứng)
exports.getStudentsByClass = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { classId } = req.params || {};
    if (!classId) {
      return res.status(400).json({ error: 'Thiếu classId' });
    }
    const clazz = await Class.findOne({ _id: classId, school_id: schoolId })
      .populate('class_age_id');
    if (!clazz) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    }
    const mappings = await StudentClass.find({ class_id: classId })
      .populate({
        path: 'student_id',
        match: { school_id: schoolId }
      });
    const students = mappings
      .map((mapping) => normalizeStudent(mapping.student_id))
      .filter(Boolean);
    const studentsWithAllergy = students.filter((student) => student.allergy?.trim()).length;
    return res.json({
      class: clazz,
      totalStudents: students.length,
      studentsWithAllergy,
      students
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'classId không hợp lệ' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Danh sách học sinh theo ClassAge (gom theo từng class)
exports.getStudentsByClassAge = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { classAgeId } = req.params || {};
    if (!classAgeId) {
      return res.status(400).json({ error: 'Thiếu classAgeId' });
    }
    const classAge = await ClassAge.findById(classAgeId);
    if (!classAge) {
      return res.status(404).json({ error: 'Không tìm thấy ClassAge' });
    }
    const classes = await Class.find({ school_id: schoolId, class_age_id: classAgeId })
      .sort({ class_name: 1 });
    if (!classes.length) {
      return res.json({
        classAge,
        totalClasses: 0,
        totalStudents: 0,
        studentsWithAllergy: 0,
        classes: []
      });
    }
    const classIds = classes.map((clazz) => clazz._id);
    const mappings = await StudentClass.find({ class_id: { $in: classIds } })
      .populate({
        path: 'student_id',
        match: { school_id: schoolId }
      })
      .populate('class_id');
    const groupedStudents = {};
    mappings.forEach((mapping) => {
      if (!mapping.student_id || !mapping.class_id) return;
      const key = String(mapping.class_id._id);
      if (!groupedStudents[key]) {
        groupedStudents[key] = [];
      }
      const normalized = normalizeStudent(mapping.student_id);
      if (normalized) {
        groupedStudents[key].push(normalized);
      }
    });
    const classResponses = classes.map((clazz) => {
      const students = groupedStudents[String(clazz._id)] || [];
      const studentsWithAllergy = students.filter((student) => student.allergy?.trim()).length;
      return {
        _id: clazz._id,
        class_name: clazz.class_name,
        totalStudents: students.length,
        studentsWithAllergy,
        students
      };
    });
    const totalStudents = classResponses.reduce((sum, item) => sum + item.totalStudents, 0);
    const studentsWithAllergy = classResponses.reduce((sum, item) => sum + item.studentsWithAllergy, 0);
    return res.json({
      classAge,
      totalClasses: classResponses.length,
      totalStudents,
      studentsWithAllergy,
      classes: classResponses
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'classAgeId không hợp lệ' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Gán danh sách món ăn cho một ClassAgeMeal (một ngày + một bữa của một nhóm tuổi)
// Body: { class_age_id, meal_id, weekday_id, date, dish_ids: [] }
exports.assignDishesToClassAgeMeal = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { class_age_id, meal_id, weekday_id, date, dish_ids } = req.body;

    if (!class_age_id || !meal_id || !weekday_id || !date || !Array.isArray(dish_ids)) {
      return res.status(400).json({ error: 'Thiếu tham số yêu cầu' });
    }

    // Validate refs existence và cùng school_id
    const [classAge, meal, weekdayExists] = await Promise.all([
      ClassAge.findOne({ _id: class_age_id, school_id: schoolId }),
      Meal.findById(meal_id),
      WeekDay.exists({ _id: weekday_id })
    ]);

    if (!classAge || !meal || !weekdayExists) {
      return res.status(400).json({ error: 'Tham chiếu không hợp lệ' });
    }

    // Validate tất cả dish_ids cùng school_id
    const dishes = await Dish.find({ _id: { $in: dish_ids }, school_id: schoolId });
    if (dishes.length !== dish_ids.length) {
      return res.status(400).json({ error: 'Một số món ăn không hợp lệ hoặc không thuộc trường học của bạn' });
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
    const dishMappings = await DishesClassAgeMeal.find({ class_age_meal_id: classAgeMeal._id }).populate({
      path: 'dish_id',
      populate: { path: 'category' }
    });

    return res.json({
      success: true,
      classAgeMeal: populated,
      dishes: dishMappings.map((d) => d.dish_id)
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
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { class_age_id, meal_id, weekday_id, date } = req.query;
    if (!class_age_id || !meal_id || !weekday_id || !date) {
      return res.status(400).json({ error: 'Thiếu tham số yêu cầu' });
    }
    
    // Validate class_age_id thuộc school_id và meal tồn tại
    const [classAge, meal] = await Promise.all([
      ClassAge.findOne({ _id: class_age_id, school_id: schoolId }),
      Meal.findById(meal_id)
    ]);
    
    if (!classAge || !meal) {
      return res.status(400).json({ error: 'Tham chiếu không hợp lệ' });
    }
    
    const normalizedDate = new Date(date);
    const classAgeMeal = await ClassAgeMeal.findOne({ class_age_id, meal_id, weekday_id, date: normalizedDate });
    if (!classAgeMeal) {
      return res.json({ dishes: [] });
    }
    const mappings = await DishesClassAgeMeal.find({ class_age_meal_id: classAgeMeal._id }).populate({
      path: 'dish_id',
      match: { school_id: schoolId },
      populate: { path: 'category' }
    });
    const validDishes = mappings.filter(m => m.dish_id).map((m) => m.dish_id);
    return res.json({
      classAgeMealId: classAgeMeal._id,
      dishes: validDishes
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// Lấy tất cả món đã gán cho một tuần (batch endpoint để tránh quá nhiều requests)
// Query: week_start (YYYY-MM-DD), class_age_ids (comma-separated), meal_ids (comma-separated), weekday_ids (comma-separated)
exports.getWeeklyAssignedDishes = async (req, res) => {
  try {
    const schoolId = await getUserSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy school_id của user' });
    }
    const { week_start, class_age_ids, meal_ids, weekday_ids } = req.query;
    
    if (!week_start) {
      return res.status(400).json({ error: 'Thiếu tham số week_start' });
    }

    const weekStartDate = new Date(week_start);
    if (isNaN(weekStartDate.getTime())) {
      return res.status(400).json({ error: 'week_start không hợp lệ' });
    }

    // Parse optional filters
    const classAgeIds = class_age_ids ? class_age_ids.split(',').filter(id => id.trim()) : null;
    const mealIds = meal_ids ? meal_ids.split(',').filter(id => id.trim()) : null;
    const weekdayIds = weekday_ids ? weekday_ids.split(',').filter(id => id.trim()) : null;

    // Build date range for the week (Monday to Sunday - 7 days)
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    // Build filter for ClassAgeMeal
    const filter = {
      date: { $in: dates }
    };
    if (classAgeIds && classAgeIds.length > 0) {
      filter.class_age_id = { $in: classAgeIds };
    }
    if (mealIds && mealIds.length > 0) {
      filter.meal_id = { $in: mealIds };
    }
    if (weekdayIds && weekdayIds.length > 0) {
      filter.weekday_id = { $in: weekdayIds };
    }

    // Find all ClassAgeMeals for the week
    const classAgeMeals = await ClassAgeMeal.find(filter)
      .populate({
        path: 'class_age_id',
        match: { school_id: schoolId }
      })
      .populate('meal_id')
      .populate('weekday_id');

    // Filter out null values from populate
    const validClassAgeMeals = classAgeMeals.filter(cam => cam.class_age_id && cam.meal_id);

    // Get all dish mappings for these ClassAgeMeals
    const classAgeMealIds = validClassAgeMeals.map(cam => cam._id);
    const mappings = await DishesClassAgeMeal.find({
      class_age_meal_id: { $in: classAgeMealIds }
    }).populate({
      path: 'dish_id',
      match: { school_id: schoolId },
      populate: { path: 'category' }
    });

    // Filter out null dish_id
    const validMappings = mappings.filter(m => m.dish_id);

    // Group dishes by classAgeMeal
    const dishesByClassAgeMeal = {};
    validMappings.forEach(mapping => {
      const camId = String(mapping.class_age_meal_id);
      if (!dishesByClassAgeMeal[camId]) {
        dishesByClassAgeMeal[camId] = [];
      }
      dishesByClassAgeMeal[camId].push(mapping.dish_id);
    });

    // Build result object with key format: classAgeId-mealId-weekdayId
    const result = {};
    validClassAgeMeals.forEach(cam => {
      const key = `${cam.class_age_id._id}-${cam.meal_id._id}-${cam.weekday_id._id}`;
      result[key] = {
        dishes: dishesByClassAgeMeal[String(cam._id)] || [],
        classAgeId: cam.class_age_id._id,
        mealId: cam.meal_id._id,
        weekdayId: cam.weekday_id._id,
        date: cam.date
      };
    });

    return res.json({ schedule: result });
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
    const { full_name, avatar_url, email, phone_number } = req.body || {};
    if (full_name !== undefined) user.full_name = full_name;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (email !== undefined) user.email = email;
    if (phone_number !== undefined) user.phone_number = phone_number;
    await user.save();
    return res.json({ message: 'Cập nhật profile thành công', user: await User.findById(userId).select('-password_hash') });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

// PUT /nutrition/change-password
exports.changeStaffPassword = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId);
    if (!user || user.role !== 'nutrition_staff') {
      return res.status(403).json({ error: 'Không đúng vai trò nutrition staff' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Xác nhận mật khẩu mới không khớp' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

