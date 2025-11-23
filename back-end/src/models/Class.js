const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  class_name: {
    type: String,
    required: true,
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
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacher_id2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Class', classSchema);



