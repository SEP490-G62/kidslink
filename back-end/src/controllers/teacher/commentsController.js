const Post = require('../../models/Post');
const PostComment = require('../../models/PostComment');
const { body, validationResult } = require('express-validator');

// POST /api/teacher/posts/:postId/comments
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { postId } = req.params;
    const { contents, parent_comment_id } = req.body;
    const userId = req.user.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (parent_comment_id) {
      const parentComment = await PostComment.findById(parent_comment_id);
      if (!parentComment) return res.status(404).json({ success: false, message: 'Không tìm thấy comment cha' });
    }
    const comment = await PostComment.create({ contents, post_id: postId, user_id: userId, parent_comment_id: parent_comment_id || null });
    await comment.populate('user_id', 'full_name username avatar_url role');
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tạo comment' });
  }
};

// Hàm đệ quy để lấy tất cả các level của replies
const getRepliesRecursively = async (parentCommentId) => {
  try {
    // Lấy tất cả replies trực tiếp của comment này
    const directReplies = await PostComment.find({ parent_comment_id: parentCommentId })
      .populate('user_id', 'full_name username avatar_url role')
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

// GET /api/teacher/posts/:postId/comments - Lấy danh sách comment của bài post
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

const createCommentValidators = [
  body('contents').isString().trim().notEmpty().withMessage('Nội dung comment là bắt buộc'),
  body('parent_comment_id').optional().isMongoId().withMessage('Parent comment ID không hợp lệ')
];

module.exports = { createComment, createCommentValidators, getComments };
