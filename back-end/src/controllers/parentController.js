const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const PostLike = require('../models/PostLike');
const PostImage = require('../models/PostImage');
const User = require('../models/User');
const Class = require('../models/Class');

// GET /api/parent/posts - Lấy tất cả các bài post cho phụ huynh
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, class_id, status = 'published' } = req.query;
    
    // Tạo filter object
    const filter = { status };
    if (class_id) filter.class_id = class_id;
    
    // Tính toán pagination
    const skip = (page - 1) * limit;
    
    // Lấy posts với populate thông tin user và class
    const posts = await Post.find(filter)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id')
      .sort({ create_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
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
        const currentUserId = req.user?.id;
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
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      success: true,
      data: postsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
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

// GET /api/parent/posts/:id - Lấy thông tin chi tiết một bài post
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy post với thông tin user và class
    const post = await Post.findById(id)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }
    
    // Lấy hình ảnh của post
    const images = await PostImage.find({ post_id: post._id });
    
    // Lấy số lượng like
    const likeCount = await PostLike.countDocuments({ post_id: post._id });
    
    // Lấy số lượng comment
    const commentCount = await PostComment.countDocuments({ post_id: post._id });
    
    // Kiểm tra user hiện tại đã like post này chưa
    const currentUserId = req.user?.id;
    let isLiked = false;
    if (currentUserId) {
      const userLike = await PostLike.findOne({ 
        post_id: post._id, 
        user_id: currentUserId 
      });
      isLiked = !!userLike;
    }
    
    // Lấy comments của post
    const comments = await PostComment.find({ post_id: post._id })
      .populate('user_id', 'full_name username avatar_url role')
      .populate('parent_comment_id')
      .sort({ create_at: 1 });
    
    const postWithDetails = {
      ...post.toObject(),
      images: images.map(img => img.image_url),
      like_count: likeCount,
      comment_count: commentCount,
      is_liked: isLiked,
      comments: comments
    };
    
    res.json({
      success: true,
      data: postWithDetails
    });
  } catch (error) {
    console.error('Error getting post by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bài đăng',
      error: error.message
    });
  }
};

// GET /api/parent/posts/:id/comments - Lấy comments của một bài post
const getPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Kiểm tra post có tồn tại không
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }
    
    // Tính toán pagination
    const skip = (page - 1) * limit;
    
    // Lấy comments với thông tin user
    const comments = await PostComment.find({ post_id: id })
      .populate('user_id', 'full_name username avatar_url role')
      .populate('parent_comment_id')
      .sort({ create_at: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PostComment.countDocuments({ post_id: id });
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting post comments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy bình luận',
      error: error.message
    });
  }
};

// POST /api/parent/posts/:id/like - Like/Unlike một bài post
const togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Kiểm tra post có tồn tại không
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }
    
    // Kiểm tra user đã like chưa
    const existingLike = await PostLike.findOne({ 
      post_id: id, 
      user_id: userId 
    });
    
    if (existingLike) {
      // Nếu đã like thì unlike
      await PostLike.findByIdAndDelete(existingLike._id);
      res.json({
        success: true,
        message: 'Đã bỏ thích bài đăng',
        action: 'unliked'
      });
    } else {
      // Nếu chưa like thì like
      await PostLike.create({
        post_id: id,
        user_id: userId
      });
      res.json({
        success: true,
        message: 'Đã thích bài đăng',
        action: 'liked'
      });
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thích/bỏ thích bài đăng',
      error: error.message
    });
  }
};

// POST /api/parent/posts/:id/comments - Thêm comment vào bài post
const addPostComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { contents, parent_comment_id } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra post có tồn tại không
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }
    
    // Tạo comment mới
    const newComment = await PostComment.create({
      contents,
      post_id: id,
      user_id: userId,
      parent_comment_id: parent_comment_id || null
    });
    
    // Populate thông tin user
    await newComment.populate('user_id', 'full_name username avatar_url role');
    
    res.status(201).json({
      success: true,
      message: 'Thêm bình luận thành công',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding post comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm bình luận',
      error: error.message
    });
  }
};

// GET /api/parent/classes - Lấy danh sách lớp học cho phụ huynh
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ status: 1 })
      .populate('class_age_id', 'age_name')
      .select('class_name class_age_id status')
      .sort({ class_name: 1 });
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error getting classes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lớp học',
      error: error.message
    });
  }
};

// GET /api/parent/posts/stats - Lấy thống kê posts
const getPostStats = async (req, res) => {
  try {
    const { class_id } = req.query;
    
    const filter = { status: 'published' };
    if (class_id) filter.class_id = class_id;
    
    // Tổng số posts
    const totalPosts = await Post.countDocuments(filter);
    
    // Posts trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      ...filter,
      create_at: { $gte: sevenDaysAgo }
    });
    
    // Posts theo tháng hiện tại
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const monthlyPosts = await Post.countDocuments({
      ...filter,
      create_at: { $gte: currentMonth }
    });
    
    res.json({
      success: true,
      data: {
        total_posts: totalPosts,
        recent_posts: recentPosts,
        monthly_posts: monthlyPosts
      }
    });
  } catch (error) {
    console.error('Error getting post stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê bài đăng',
      error: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  getPostComments,
  togglePostLike,
  addPostComment,
  getClasses,
  getPostStats
};
