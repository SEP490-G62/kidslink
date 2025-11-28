const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  meal: {
    type: String,
    required: true,
    trim: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meal', mealSchema);




