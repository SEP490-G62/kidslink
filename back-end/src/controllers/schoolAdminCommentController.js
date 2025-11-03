const PostComment = require('../models/PostComment');
const Post = require('../models/Post');
const User = require('../models/User');

// GET comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Get all comments for this post
    const comments = await PostComment.find({ post_id: postId })
      .populate({
        path: 'user_id',
        select: 'full_name avatar_url role'
      })
      .sort({ create_at: -1 })
      .lean();

    // Organize comments into tree structure (parent and replies)
    const commentMap = {};
    const rootComments = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap[comment._id.toString()] = {
        ...comment,
        replies: []
      };
    });

    // Second pass: organize into tree
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parentId = comment.parent_comment_id.toString();
        if (commentMap[parentId]) {
          commentMap[parentId].replies.push(commentMap[comment._id.toString()]);
        }
      } else {
        rootComments.push(commentMap[comment._id.toString()]);
      }
    });

    return res.json({
      success: true,
      data: {
        comments: rootComments,
        total: comments.length
      }
    });
  } catch (error) {
    console.error('getComments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bình luận',
      error: error.message
    });
  }
};

// DELETE comment (school admin can delete any comment)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await PostComment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // No permission check needed - only one school in system
    // School admin can delete any comment

    // Delete all child comments (replies) recursively
    const deleteReplies = async (parentId) => {
      const replies = await PostComment.find({ parent_comment_id: parentId });
      for (const reply of replies) {
        await deleteReplies(reply._id);
        await PostComment.findByIdAndDelete(reply._id);
      }
    };

    await deleteReplies(commentId);
    
    // Delete the comment itself
    await PostComment.findByIdAndDelete(commentId);

    return res.json({
      success: true,
      message: 'Đã xóa bình luận thành công'
    });
  } catch (error) {
    console.error('deleteComment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: error.message
    });
  }
};

// GET likes for a post
const getLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const PostLike = require('../models/PostLike');

    const likes = await PostLike.find({ post_id: postId })
      .populate({
        path: 'user_id',
        select: 'full_name avatar_url role'
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        likes,
        total: likes.length
      }
    });
  } catch (error) {
    console.error('getLikes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lượt thích',
      error: error.message
    });
  }
};

module.exports = {
  getComments,
  deleteComment,
  getLikes
};
