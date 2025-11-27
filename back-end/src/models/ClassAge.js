const mongoose = require('mongoose');

const classAgeSchema = new mongoose.Schema({
  age: {
    type: Number,
    required: true
  },
  age_name: {
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

module.exports = mongoose.model('ClassAge', classAgeSchema);

