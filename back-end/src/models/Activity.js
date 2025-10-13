const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activity_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  require_outdoor: {
    type: Number,
    default: 0 // 0: indoor, 1: outdoor
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);


