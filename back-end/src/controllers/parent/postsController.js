const Post = require('../../models/Post');
const PostImage = require('../../models/PostImage');
const PostLike = require('../../models/PostLike');
const PostComment = require('../../models/PostComment');
const User = require('../../models/User');
const Parent = require('../../models/Parent');
const ParentStudent = require('../../models/ParentStudent');
const StudentClass = require('../../models/StudentClass');
const Class = require('../../models/Class');


// GET /api/parent/posts - Lấy tất cả các bài post cho phụ huynh
const getAllPosts = async (req, res) => {
  try {
    // Tạo filter object với trạng thái published mặc định
    const filter = { status: 'published' };
    
    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: req.user.id });
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
        const currentUserId = req.user.id;
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


module.exports = {
  getAllPosts
};
