const mongoose = require('mongoose');

const studentClassSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
studentClassSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentClass', studentClassSchema);




