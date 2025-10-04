const mongoose = require('mongoose');

const classAgeMealSchema = new mongoose.Schema({
  class_age_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassAge',
    required: true
  },
  meal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  meal_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClassAgeMeal', classAgeMealSchema);
