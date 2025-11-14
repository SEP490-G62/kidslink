const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  dish_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  meal_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', dishSchema);




