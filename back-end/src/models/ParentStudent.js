const mongoose = require('mongoose');

const parentStudentSchema = new mongoose.Schema({
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  relationship: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
parentStudentSchema.index({ parent_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('ParentStudent', parentStudentSchema);




