const mongoose = require('mongoose');

const postImageSchema = new mongoose.Schema({
  image_url: {
    type: String,
    required: true
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PostImage', postImageSchema);




