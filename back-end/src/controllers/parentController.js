const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const PostLike = require('../models/PostLike');
const PostImage = require('../models/PostImage');
const User = require('../models/User');
const Class = require('../models/Class');
const Parent = require('../models/Parent');
const ParentStudent = require('../models/ParentStudent');
const StudentClass = require('../models/StudentClass');
const { body, validationResult } = require('express-validator');

// GET /api/parent/posts - Lấy tất cả các bài post cho phụ huynh
const getAllPosts = async (req, res) => {
  try {
    // Tạo filter object với trạng thái published mặc định
    const filter = { status: 'published' };
    
    // TẠM THỜI: Bỏ qua kiểm tra role để test với parent ID cố định
    // TODO: Thêm lại kiểm tra req.user.role === 'parent' khi có authentication đầy đủ
    // if (req.user && req.user.role === 'parent') {
    {
      // TẠM THỜI: Sử dụng parent ID cố định để test
      // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
      const parentId = '6710a0000000000000000401'; // Parent ID từ sample data (Phụ huynh Nguyễn Thị D)
      
      // Lấy thông tin phụ huynh
      // const parent = await Parent.findOne({ user_id: req.user.id });
      const parent = await Parent.findById(parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin phụ huynh'
        });
      }
      
      // Tự động lấy danh sách học sinh của phụ huynh
      const parentStudents = await ParentStudent.find({ parent_id: parent._id });
      const studentIds = parentStudents.map(ps => ps.student_id);
      
      // Kiểm tra phụ huynh có con không
      if (studentIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Phụ huynh chưa có con học tại trường'
        });
      }
      
      // Tự động lấy danh sách lớp học của các học sinh
      const studentClasses = await StudentClass.find({ student_id: { $in: studentIds } });
      const childrenClassIds = studentClasses.map(sc => sc.class_id);
      
      // Tạo điều kiện OR để cho phép xem:
      const orConditions = [];
      
      // Điều kiện 1: Bài viết của trường (school_admin) - TẤT CẢ user thấy
      const schoolUserIds = await User.find({ role: { $in: ['school_admin'] }}).distinct('_id');
      orConditions.push({
        'user_id': { $in: schoolUserIds }
      });
      
      // Điều kiện 2: Bài viết của phụ huynh - TẤT CẢ user thấy
      const parentUserIds = await User.find({ role: 'parent' }).distinct('_id');
      orConditions.push({
        'user_id': { $in: parentUserIds }
      });
      
      // Điều kiện 3: Bài viết của giáo viên - CHỈ trong phạm vi lớp con học
      const teacherUserIds = await User.find({ role: 'teacher' }).distinct('_id');
      if (childrenClassIds.length > 0) {
        orConditions.push({
          'user_id': { $in: teacherUserIds },
          'class_id': { $in: childrenClassIds }
        });
      }
      
      // Kiểm tra có điều kiện hợp lệ không
      if (orConditions.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Không có bài viết nào phù hợp'
        });
      }
      
      // Áp dụng điều kiện OR
      filter.$or = orConditions;
    }
    
    // Lấy posts với populate thông tin user và class
    const posts = await Post.find(filter)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id')
      .sort({ create_at: -1 });
    
    // Lấy thêm thông tin chi tiết cho mỗi post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Lấy hình ảnh của post
        const images = await PostImage.find({ post_id: post._id });
        
        // Lấy số lượng like
        const likeCount = await PostLike.countDocuments({ post_id: post._id });
        
        // Lấy số lượng comment
        const commentCount = await PostComment.countDocuments({ post_id: post._id });
        
        // Kiểm tra user hiện tại đã like post này chưa
        // TẠM THỜI: Sử dụng user ID cố định để test
        // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
        const currentUserId = req.user?.id || '6710a0000000000000000004'; // User ID của Phụ huynh Nguyễn Thị D
        let isLiked = false;
        if (currentUserId) {
          const userLike = await PostLike.findOne({ 
            post_id: post._id, 
            user_id: currentUserId 
          });
          isLiked = !!userLike;
        }
        
        return {
          ...post.toObject(),
          images: images.map(img => img.image_url),
          like_count: likeCount,
          comment_count: commentCount,
          is_liked: isLiked
        };
      })
    );
    
    res.json({
      success: true,
      data: postsWithDetails
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài đăng',
      error: error.message
    });
  }
};


// POST /api/parent/posts/:postId/like - Like/Unlike bài post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    // TẠM THỜI: Sử dụng user ID cố định để test
    // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
    const userId = req.user?.id || '6710a0000000000000000004'; // User ID của Phụ huynh Nguyễn Thị D

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
    // TẠM THỜI: Sử dụng user ID cố định để test
    // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
    const userId = req.user?.id || '6710a0000000000000000004'; // User ID của Phụ huynh Nguyễn Thị D

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

    // Lấy replies cho mỗi comment
    for (let comment of comments) {
      const replies = await PostComment.find({ parent_comment_id: comment._id })
        .populate('user_id', 'full_name username avatar_url role')
        .sort({ create_at: 1 })
        .limit(5); // Giới hạn 5 replies để tránh quá tải
      
      comment.replies = replies;
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
    // TẠM THỜI: Sử dụng user ID cố định để test
    // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
    const userId = req.user?.id || '6710a0000000000000000004'; // User ID của Phụ huynh Nguyễn Thị D

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
    // TẠM THỜI: Sử dụng user ID cố định để test
    // TODO: Thay đổi thành req.user.id khi có authentication đầy đủ
    const userId = req.user?.id || '6710a0000000000000000004'; // User ID của Phụ huynh Nguyễn Thị D

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
  getAllPosts,
  toggleLike,
  getLikes,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  createCommentValidators
};
