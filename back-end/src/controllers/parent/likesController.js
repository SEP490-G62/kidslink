const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');

// POST /api/parent/posts/:postId/like - Like/Unlike bài post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Kiểm tra bài post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Kiểm tra user đã like chưa
    const existingLike = await PostLike.findOne({
      post_id: postId,
      user_id: userId
    });

    let isLiked = false;
    let likeCount = 0;

    if (existingLike) {
      // Nếu đã like thì unlike
      await PostLike.findByIdAndDelete(existingLike._id);
      isLiked = false;
    } else {
      // Nếu chưa like thì like
      await PostLike.create({
        post_id: postId,
        user_id: userId
      });
      isLiked = true;
    }

    // Đếm số lượng like
    likeCount = await PostLike.countDocuments({ post_id: postId });

    res.json({
      success: true,
      data: {
        isLiked,
        likeCount
      }
    });
  } catch (error) {
    console.error('Error in toggleLike:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý like'
    });
  }
};

// GET /api/parent/posts/:postId/likes - Lấy danh sách user đã like bài post
const getLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const likes = await PostLike.find({ post_id: postId })
      .populate('user_id', 'full_name username avatar_url')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLikes = await PostLike.countDocuments({ post_id: postId });

    res.json({
      success: true,
      data: {
        likes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLikes / limit),
          totalLikes
        }
      }
    });
  } catch (error) {
    console.error('Error in getLikes:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách like'
    });
  }
};

module.exports = {
  toggleLike,
  getLikes
};
