const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  class_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  academic_year: {
    type: String,
    required: true,
    trim: true
  },
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  class_age_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassAge',
    required: true
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Class', classSchema);
