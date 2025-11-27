const Post = require('../models/Post');
const PostImage = require('../models/PostImage');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const User = require('../models/User');

// GET all posts for school admin (can see all posts regardless of status)
const getAllPosts = async (req, res) => {
  try {
    // Determine school of current admin
    const admin = await User.findById(req.user.id).select('school_id');
    if (!admin || !admin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản quản trị không có thông tin trường'
      });
    }
    const adminSchoolId = admin.school_id.toString();

    const posts = await Post.find()
      .populate({
        path: 'user_id',
        select: 'full_name email avatar_url role school_id'
      })
      .populate({
        path: 'class_id',
        select: 'class_name academic_year school_id',
        populate: {
          path: 'school_id',
          select: 'school_name'
        }
      })
      .sort({ create_at: -1 })
      .lean();

    // Helper to normalize ObjectId/string to string
    const toIdString = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      if (value._id) return value._id.toString();
      if (value.toString) return value.toString();
      return null;
    };

    // Get images, likes, and comments for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        // Get images
        const images = await PostImage.find({ post_id: post._id }).lean();
        
        // Get likes count
        const likes_count = await PostLike.countDocuments({ post_id: post._id });
        
        // Get comments count
        const comments_count = await PostComment.countDocuments({ post_id: post._id });
        
        return {
          ...post,
          images: images.map(img => img.image_url),
          likes_count,
          comments_count
        };
      })
    );

    const filteredPosts = postsWithDetails.filter((post) => {
      const classSchoolId = toIdString(post.class_id?.school_id);
      const authorSchoolId = toIdString(post.user_id?.school_id);
      return classSchoolId === adminSchoolId || authorSchoolId === adminSchoolId;
    });

    return res.json({
      success: true,
      data: filteredPosts,
      total: filteredPosts.length
    });
  } catch (error) {
    console.error('getAllPosts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài đăng',
      error: error.message
    });
  }
};

// GET single post
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate({
        path: 'user_id',
        select: 'full_name email avatar_url role school_id'
      })
      .populate({
        path: 'class_id',
        select: 'class_name academic_year'
      })
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    // Get images
    const images = await PostImage.find({ post_id: post._id }).lean();
    
    // Get likes
    const likes = await PostLike.find({ post_id: post._id })
      .populate('user_id', 'full_name avatar_url')
      .lean();
    
    // Get comments
    const comments = await PostComment.find({ post_id: post._id })
      .populate('user_id', 'full_name avatar_url')
      .sort({ create_at: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        ...post,
        images: images.map(img => img.image_url),
        likes,
        comments
      }
    });
  } catch (error) {
    console.error('getPostById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bài đăng',
      error: error.message
    });
  }
};

// UPDATE post status (approve/reject)
const updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { status },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    return res.json({
      success: true,
      message: `Đã ${status === 'approved' ? 'duyệt' : 'chuyển về chờ duyệt'} bài đăng`,
      data: post
    });
  } catch (error) {
    console.error('updatePostStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái bài đăng',
      error: error.message
    });
  }
};

// DELETE post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    // No permission check needed - only one school in system

    // Delete related images
    await PostImage.deleteMany({ post_id: postId });
    
    // Delete related likes
    await PostLike.deleteMany({ post_id: postId });
    
    // Delete related comments
    await PostComment.deleteMany({ post_id: postId });
    
    // Delete post
    await Post.findByIdAndDelete(postId);

    return res.json({
      success: true,
      message: 'Đã xóa bài đăng thành công'
    });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài đăng',
      error: error.message
    });
  }
};

// CREATE post (school admin can create posts)
const createPost = async (req, res) => {
  try {
    const { content, class_id, images, scope = 'school' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bài đăng là bắt buộc'
      });
    }

    // Validate scope & class
    if (scope === 'class') {
      if (!class_id) {
        return res.status(400).json({ success: false, message: 'class_id là bắt buộc khi đăng cho lớp' });
      }
      const ClassModel = require('../models/Class');
      const classInfo = await ClassModel.findById(class_id);
      if (!classInfo) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      }
    }

    // Create post with approved status (school admin posts are auto-approved)
    const post = await Post.create({
      content,
      user_id: req.user.id,
      scope: scope === 'class' ? 'class' : 'school',
      class_id: scope === 'class' ? class_id : null,
      status: 'approved',
      create_at: new Date()
    });

    // Save images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imagePromises = images.map(imageUrl =>
        PostImage.create({
          post_id: post._id,
          image_url: imageUrl
        })
      );
      await Promise.all(imagePromises);
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo bài đăng thành công',
      data: post
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bài đăng',
      error: error.message
    });
  }
};

// UPDATE post
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, class_id, images, scope } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    // No permission check needed - only one school in system

    // Update post
    if (content) post.content = content;
    if (scope) {
      if (scope === 'school') {
        post.scope = 'school';
        post.class_id = null;
      } else if (scope === 'class') {
        if (!class_id) {
          return res.status(400).json({ success: false, message: 'class_id là bắt buộc khi đổi sang phạm vi lớp' });
        }
        const ClassModel = require('../models/Class');
        const classInfo = await ClassModel.findById(class_id);
        if (!classInfo) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }
        post.scope = 'class';
        post.class_id = class_id;
      }
    } else if (class_id !== undefined) {
      // Maintain backward compatibility if only class_id passed
      post.scope = 'class';
      post.class_id = class_id;
    }
    await post.save();

    // Update images if provided
    if (images !== undefined) {
      // Delete old images
      await PostImage.deleteMany({ post_id: postId });
      
      // Add new images
      if (Array.isArray(images) && images.length > 0) {
        const imagePromises = images.map(imageUrl =>
          PostImage.create({
            post_id: post._id,
            image_url: imageUrl
          })
        );
        await Promise.all(imagePromises);
      }
    }

    return res.json({
      success: true,
      message: 'Cập nhật bài đăng thành công',
      data: post
    });
  } catch (error) {
    console.error('updatePost error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bài đăng',
      error: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  updatePostStatus,
  deletePost,
  createPost,
  updatePost
};
