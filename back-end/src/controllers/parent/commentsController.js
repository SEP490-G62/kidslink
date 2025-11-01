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

    // Tạo comment mới (giữ nguyên parent_comment_id: level sau có parent là level trước)
    const comment = await PostComment.create({
      contents,
      post_id: postId,
      user_id: userId,
      parent_comment_id: parent_comment_id || null
    });

    // Populate thông tin user và parent comment (nếu có)
    await comment.populate('user_id', 'full_name username avatar_url role');
    if (parent_comment_id) {
      await comment.populate({
        path: 'parent_comment_id',
        select: 'user_id contents',
        populate: {
          path: 'user_id',
          select: 'full_name username avatar_url role'
        }
      });
    }

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

// Hàm đệ quy để lấy tất cả các level của replies
const getRepliesRecursively = async (parentCommentId) => {
  try {
    // Lấy tất cả replies trực tiếp của comment này
    const directReplies = await PostComment.find({ parent_comment_id: parentCommentId })
      .populate('user_id', 'full_name username avatar_url role')
      .populate({
        path: 'parent_comment_id',
        select: 'user_id contents',
        populate: {
          path: 'user_id',
          select: 'full_name username avatar_url role'
        }
      })
      .sort({ create_at: 1 });

    // Với mỗi reply, lấy tiếp các replies của nó (đệ quy)
    const repliesWithNested = [];
    for (let reply of directReplies) {
      const replyObj = reply.toObject();
      // Gọi đệ quy để lấy tất cả replies của reply này
      replyObj.replies = await getRepliesRecursively(reply._id);
      repliesWithNested.push(replyObj);
    }

    return repliesWithNested;
  } catch (error) {
    console.error('Error in getRepliesRecursively:', error);
    return [];
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

    // Lấy tất cả replies cho mỗi comment (bao gồm tất cả các level)
    const commentsWithReplies = [];
    for (let comment of comments) {
      const commentObj = comment.toObject();
      // Sử dụng hàm đệ quy để lấy tất cả các level của replies
      commentObj.replies = await getRepliesRecursively(comment._id);
      commentsWithReplies.push(commentObj);
    }

    const totalComments = await PostComment.countDocuments({ 
      post_id: postId,
      parent_comment_id: null
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
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

// Ghi chú: Trước đây dùng xóa đệ quy toàn bộ replies. Nay chuyển sang "đẩy lên" (re-parent)
// nên không dùng hàm xóa đệ quy nữa.

// DELETE /api/parent/comments/:commentId - Xóa comment và đẩy các replies lên cấp trên
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

    // Đẩy tất cả replies trực tiếp của comment này lên comment cha (hoặc top-level nếu không có cha)
    await PostComment.updateMany(
      { parent_comment_id: commentId },
      { $set: { parent_comment_id: comment.parent_comment_id || null } }
    );

    // Xóa comment chính
    await PostComment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Xóa comment thành công, các trả lời đã được đẩy lên'
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
