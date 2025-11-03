const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');

// POST /api/teacher/posts/:postId/like - Giáo viên like bài post
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    // Kiểm tra tồn tại bài post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

    // Kiểm tra đã like chưa (unique index)
    const isLiked = await PostLike.findOne({ post_id: postId, user_id: userId });
    if (isLiked) return res.json({ success: true, message: 'Đã like trước đó.' });

    await PostLike.create({ post_id: postId, user_id: userId });
    res.json({ success: true, message: 'Đã like bài viết.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi like', error: error.message });
  }
};
// DELETE /api/teacher/posts/:postId/like - Giáo viên bỏ like
const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    await PostLike.deleteOne({ post_id: postId, user_id: userId });
    res.json({ success: true, message: 'Đã bỏ like.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi unlike', error: error.message });
  }
};
module.exports = {
  likePost,
  unlikePost,
};
