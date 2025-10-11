const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  dish_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', dishSchema);




