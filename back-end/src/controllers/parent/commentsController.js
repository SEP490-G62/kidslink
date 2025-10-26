const Post = require('../../models/Post');
const PostComment = require('../../models/PostComment');
const { body, validationResult } = require('express-validator');

// POST /api/parent/posts/:postId/comments - Tạo comment mới
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { postId } = req.params;
    const { contents, parent_comment_id } = req.body;
    const userId = req.user.id;

    // Kiểm tra bài post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Nếu có parent_comment_id, kiểm tra comment cha có tồn tại không
    if (parent_comment_id) {
      const parentComment = await PostComment.findById(parent_comment_id);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy comment cha'
        });
      }
    }

    // Tạo comment mới
    const comment = await PostComment.create({
      contents,
      post_id: postId,
      user_id: userId,
      parent_comment_id: parent_comment_id || null
    });

    // Populate thông tin user
    await comment.populate('user_id', 'full_name username avatar_url role');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error in createComment:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo comment'
    });
  }
};

// GET /api/parent/posts/:postId/comments - Lấy danh sách comment của bài post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // Lấy top-level comments (không có parent_comment_id)
    const comments = await PostComment.find({ 
      post_id: postId,
      parent_comment_id: null
    })
      .populate('user_id', 'full_name username avatar_url role')
      .sort({ create_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Lấy replies cho mỗi comment (bao gồm nested replies)
    for (let comment of comments) {
      const replies = await PostComment.find({ parent_comment_id: comment._id })
        .populate('user_id', 'full_name username avatar_url role')
        .sort({ create_at: 1 })
        .limit(10);
      
      // Fetch nested replies cho mỗi reply
      for (let reply of replies) {
        const nestedReplies = await PostComment.find({ parent_comment_id: reply._id })
          .populate('user_id', 'full_name username avatar_url role')
          .sort({ create_at: 1 })
          .limit(5); // Limit nested replies
        
        // Convert reply to plain object và thêm nested replies
        const replyObj = reply.toObject();
        replyObj.replies = nestedReplies;
        
        // Thay thế reply trong array
        const replyIndex = replies.findIndex(r => r._id.toString() === reply._id.toString());
        if (replyIndex !== -1) {
          replies[replyIndex] = replyObj;
        }
      }
      
      // Convert to plain object để có thể thêm replies
      const commentObj = comment.toObject();
      commentObj.replies = replies;
      
      // Thay thế comment trong array
      const commentIndex = comments.findIndex(c => c._id.toString() === comment._id.toString());
      if (commentIndex !== -1) {
        comments[commentIndex] = commentObj;
      }
    }

    const totalComments = await PostComment.countDocuments({ 
      post_id: postId,
      parent_comment_id: null
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments
        }
      }
    });
  } catch (error) {
    console.error('Error in getComments:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách comment'
    });
  }
};

// PUT /api/parent/comments/:commentId - Cập nhật comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { contents } = req.body;
    const userId = req.user.id;

    const comment = await PostComment.findOne({
      _id: commentId,
      user_id: userId
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy comment hoặc không có quyền chỉnh sửa'
      });
    }

    comment.contents = contents;
    await comment.save();

    await comment.populate('user_id', 'full_name username avatar_url role');

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error in updateComment:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật comment'
    });
  }
};

// DELETE /api/parent/comments/:commentId - Xóa comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await PostComment.findOne({
      _id: commentId,
      user_id: userId
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy comment hoặc không có quyền xóa'
      });
    }

    // Xóa tất cả replies của comment này
    await PostComment.deleteMany({ parent_comment_id: commentId });
    
    // Xóa comment chính
    await PostComment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Xóa comment thành công'
    });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa comment'
    });
  }
};

// Validators
const createCommentValidators = [
  body('contents').isString().trim().notEmpty().withMessage('Nội dung comment là bắt buộc'),
  body('parent_comment_id').optional().isMongoId().withMessage('Parent comment ID không hợp lệ')
];

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  createCommentValidators
};
