const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  meal: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meal', mealSchema);




