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
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
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

complaintTypeSchema.statics.findParentTypeById = function(typeId, schoolId) {
  const filter = {
    _id: typeId,
    category: { $in: ['parent'] }
  };

  if (schoolId) {
    filter.school_id = schoolId;
  }

  return this.findOne(filter);
};

complaintTypeSchema.statics.findTeacherTypeById = function(typeId, schoolId) {
  const filter = {
    _id: typeId,
    category: { $in: ['teacher'] }
  };

  if (schoolId) {
    filter.school_id = schoolId;
  }

  return this.findOne(filter);
};

module.exports = mongoose.model('ComplaintType', complaintTypeSchema);

