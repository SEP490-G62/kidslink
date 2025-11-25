const mongoose = require('mongoose');

const complaintTypeSchema = new mongoose.Schema({
  category: {
    type: [String],
    required: true,
    enum: ['teacher', 'parent'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Phải có ít nhất một loại người dùng'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

complaintTypeSchema.statics.findParentTypeById = function(typeId) {
  return this.findOne({
    _id: typeId,
    category: { $in: ['parent'] }
  });
};

complaintTypeSchema.statics.findTeacherTypeById = function(typeId) {
  return this.findOne({
    _id: typeId,
    category: { $in: ['teacher'] }
  });
};

module.exports = mongoose.model('ComplaintType', complaintTypeSchema);

