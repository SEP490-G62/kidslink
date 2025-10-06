const mongoose = require('mongoose');

const teacherClassSchema = new mongoose.Schema({
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher_id_2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null // For assistant teacher
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
teacherClassSchema.index({ teacher_id: 1, class_id: 1 }, { unique: true });

module.exports = mongoose.model('TeacherClass', teacherClassSchema);

