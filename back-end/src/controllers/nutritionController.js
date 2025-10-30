const mongoose = require('mongoose');
const { Dish, ClassAge, ClassAgeMeal } = require('../models');

// Lấy danh sách tất cả món ăn
exports.listDishes = async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ dish_name: 1 });
    res.json({ count: dishes.length, dishes });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
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
