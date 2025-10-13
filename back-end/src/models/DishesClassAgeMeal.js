const mongoose = require('mongoose');

const dishesClassAgeMealSchema = new mongoose.Schema({
  class_age_meal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassAgeMeal',
    required: true
  },
  dish_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
dishesClassAgeMealSchema.index({ class_age_meal_id: 1, dish_id: 1 }, { unique: true });

module.exports = mongoose.model('DishesClassAgeMeal', dishesClassAgeMealSchema);
