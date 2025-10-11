const mongoose = require('mongoose');

const pickupStudentSchema = new mongoose.Schema({
  pickup_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  }
}, {
  timestamps: true
});

// Tạo compound index để đảm bảo unique combination
pickupStudentSchema.index({ pickup_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('PickupStudent', pickupStudentSchema);




