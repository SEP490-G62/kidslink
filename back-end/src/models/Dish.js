const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  dish_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  class_age_meal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassAgeMeal',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', dishSchema);
