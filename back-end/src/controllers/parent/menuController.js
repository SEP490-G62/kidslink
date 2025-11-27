const {
  Parent,
  ParentStudent,
  StudentClass,
  Class: ClassModel,
  ClassAge,
  ClassAgeMeal,
  Meal,
  WeekDay,
  Dish,
  DishesClassAgeMeal
} = require('../../models');

function startOfWeekMondayUTC(date) {
  // Normalize to UTC midnight
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = base.getUTCDay(); // 0..6, 1 = Mon
  const diff = dow === 0 ? -6 : 1 - dow; // move to Monday
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function addDaysUTC(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// GET /parent/menu?student_id=optional
// Trả về toàn bộ thực đơn theo ngày (không filter theo tuần), frontend sẽ lọc theo tuần giống Calendar
async function getWeeklyMenuLatest(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Chưa xác thực' });

    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) return res.status(404).json({ error: 'Không tìm thấy hồ sơ phụ huynh' });

    const requestedStudentId = req.query.student_id;

    // Xác thực học sinh thuộc phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id });
    if (parentStudents.length === 0) {
      return res.status(404).json({ error: 'Phụ huynh chưa có học sinh liên kết' });
    }
    const studentIds = parentStudents.map(ps => ps.student_id.toString());
    const targetStudentId = requestedStudentId && studentIds.includes(requestedStudentId)
      ? requestedStudentId
      : studentIds[0];

    // Lấy lớp hiện có của học sinh (ưu tiên năm học mới nhất)
    const studentClasses = await StudentClass.find({ student_id: targetStudentId }).populate('class_id');
    if (studentClasses.length === 0) return res.status(404).json({ error: 'Học sinh chưa được xếp lớp' });

    function parseAcademicYear(ay) {
      if (!ay || typeof ay !== 'string') return -Infinity;
      const parts = ay.split('-');
      const startYear = parseInt(parts[0], 10);
      return Number.isFinite(startYear) ? startYear : -Infinity;
    }

    const latestClass = studentClasses
      .slice()
      .sort((a, b) => parseAcademicYear(b.class_id?.academic_year) - parseAcademicYear(a.class_id?.academic_year))[0]
      .class_id;

    const classAgeId = latestClass.class_age_id;

    // Tính khoảng ngày tuần cần lấy
    // Lấy toàn bộ ClassAgeMeal theo class_age_id
    const classAgeMeals = await ClassAgeMeal.find({
      class_age_id: classAgeId
    })
      .populate('weekday_id')
      .populate('meal_id')
      .sort({ date: -1 });

    const camIds = classAgeMeals.map(cam => cam._id);
    const dishesLinks = await DishesClassAgeMeal.find({ class_age_meal_id: { $in: camIds } }).populate('dish_id');

    // Group dish links by class_age_meal_id
    const camIdToDishes = new Map();
    for (const link of dishesLinks) {
      const key = link.class_age_meal_id.toString();
      if (!camIdToDishes.has(key)) camIdToDishes.set(key, []);
      camIdToDishes.get(key).push({
        id: link.dish_id?._id,
        name: link.dish_id?.dish_name,
        description: link.dish_id?.description
      });
    }

    // Group theo ngày (YYYY-MM-DD)
    const dateKeyToMeals = new Map();
    for (const cam of classAgeMeals) {
      const key = new Date(cam.date).toISOString().split('T')[0];
      if (!dateKeyToMeals.has(key)) dateKeyToMeals.set(key, { date: cam.date, weekday: cam.weekday_id?.day_of_week || null, meals: {} });
      const bucket = dateKeyToMeals.get(key);
      const mealName = cam.meal_id?.meal || 'Meal';
      bucket.meals[mealName] = camIdToDishes.get(cam._id.toString()) || [];
    }

    const menus = Array.from(dateKeyToMeals.entries())
      .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
      .map(([dateISO, v]) => ({ date: v.date, dateISO, weekday: v.weekday, meals: v.meals }));

    const result = {
      class: {
        id: latestClass._id,
        name: latestClass.class_name,
        academicYear: latestClass.academic_year
      },
      classAge: classAgeId,
      menus
    };

    return res.json(result);
  } catch (error) {
    console.error('getWeeklyMenuLatest Error:', error);
    return res.status(500).json({ error: 'Lỗi lấy thực đơn tuần' });
  }
}

module.exports = { getWeeklyMenuLatest };


