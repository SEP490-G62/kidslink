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

// CREATE comment (school admin can comment on posts)
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { contents, parent_comment_id } = req.body;

    if (!contents || !contents.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    // Create comment
    const comment = await PostComment.create({
      post_id: postId,
      user_id: req.user.id,
      contents: contents.trim(),
      parent_comment_id: parent_comment_id || null,
      create_at: new Date()
    });

    // Populate user info
    await comment.populate({
      path: 'user_id',
      select: 'full_name avatar_url role'
    });

    return res.status(201).json({
      success: true,
      message: 'Đã tạo bình luận thành công',
      data: comment
    });
  } catch (error) {
    console.error('createComment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bình luận',
      error: error.message
    });
  }
};

// TOGGLE like for a post (school admin can like posts)
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const PostLike = require('../models/PostLike');

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    // Check if user already liked
    const existingLike = await PostLike.findOne({
      post_id: postId,
      user_id: req.user.id
    });

    if (existingLike) {
      // Unlike
      await PostLike.findByIdAndDelete(existingLike._id);
      return res.json({
        success: true,
        message: 'Đã bỏ thích',
        isLiked: false
      });
    } else {
      // Like
      await PostLike.create({
        post_id: postId,
        user_id: req.user.id
      });
      return res.json({
        success: true,
        message: 'Đã thích bài đăng',
        isLiked: true
      });
    }
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thích bài đăng',
      error: error.message
    });
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  getLikes,
  toggleLike
};
