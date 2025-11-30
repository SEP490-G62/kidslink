const Post = require('../../models/Post');
const PostImage = require('../../models/PostImage');
const Teacher = require('../../models/Teacher');
const Class = require('../../models/Class');
const StudentClass = require('../../models/StudentClass');
const ParentStudent = require('../../models/ParentStudent');
const PostLike = require('../../models/PostLike');
const PostComment = require('../../models/PostComment');
const User = require('../../models/User');
const cloudinary = require('../../utils/cloudinary');

// POST /api/teachers/posts - Giáo viên tạo bài đăng
const createPost = async (req, res) => {
  try {
    const { content, images, class_id } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bài viết'
      });
    }

    // Lấy thông tin giáo viên
    const teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin giáo viên'
      });
    }

    // Lấy thông tin user để kiểm tra school_id
    const currentUser = await User.findById(userId).select('school_id');
    if (!currentUser || !currentUser.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được trường của giáo viên'
      });
    }
    const schoolId = currentUser.school_id;

    // Xác định lớp học để đăng bài
    let targetClassId = null;
    
    if (class_id) {
      // Kiểm tra class_id có thuộc về teacher không
      const teacherClass = await Class.findOne({
        _id: class_id,
        $or: [
          { teacher_id: teacher._id },
          { teacher_id2: teacher._id }
        ],
        school_id: schoolId
      });
      
      if (!teacherClass) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền đăng bài cho lớp này'
        });
      }
      
      targetClassId = class_id;
    } else {
      // Nếu không có class_id, lấy lớp đầu tiên mà giáo viên phụ trách
      const teacherClass = await Class.findOne({
        $or: [
          { teacher_id: teacher._id },
          { teacher_id2: teacher._id }
        ],
        school_id: schoolId
      });
      
      if (!teacherClass) {
        return res.status(400).json({
          success: false,
          message: 'Bạn không phụ trách lớp nào'
        });
      }
      
      targetClassId = teacherClass._id;
    }

    // Kiểm tra lớp học có tồn tại không
    const classExists = await Class.findById(targetClassId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Lớp học không tồn tại'
      });
    }

    // Tạo post (giáo viên được approved ngay)
    const newPost = await Post.create({
      content,
      user_id: userId,
      class_id: targetClassId,
      status: 'approved',
      create_at: new Date()
    });

    // Upload images to Cloudinary if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          try {
            const result = await cloudinary.uploader.upload(image, {
              folder: 'posts',
              resource_type: 'image',
            });
            return result.secure_url;
          } catch (error) {
            console.error('Error uploading image:', error);
            return null;
          }
        })
      );

      // Save images to database
      await Promise.all(
        uploadedImages
          .filter(url => url !== null)
          .map(url => PostImage.create({
            post_id: newPost._id,
            image_url: url
          }))
      );
    }

    // Lấy post mới với full details
    const postWithDetails = await Post.findById(newPost._id)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id');

    res.json({
      success: true,
      data: postWithDetails,
      message: 'Đăng bài thành công'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo bài đăng',
      error: error.message
    });
  }
};

// 2. Lấy tất cả bài post của giáo viên trong lớp mình (phụ huynh gọi)
const getAllTeacherPostsForParent = async (req, res) => {
  try {
    const parent = await require('../../models/Parent').findOne({ user_id: req.user.id });
    if (!parent) return res.status(403).json({ success: false, message: 'Không tìm thấy phụ huynh.' });

    // Lấy tất cả học sinh của phụ huynh này
    const parentStudents = await ParentStudent.find({ parent_id: parent._id });
    const studentIds = parentStudents.map(ps => ps.student_id);
    if (!studentIds.length)
      return res.json({ success: true, data: [], message: 'Bạn không có học sinh liên kết nào!' });

    // Lấy các lớp của các học sinh này
    const studentClasses = await StudentClass.find({ student_id: { $in: studentIds } });
    const classIds = studentClasses.map(sc => sc.class_id);
    if (!classIds.length)
      return res.json({ success: true, data: [], message: 'Không tìm thấy lớp cho học sinh!' });

    // Lấy posts do giáo viên lớp đó đăng (chỉ status=approved)
    const teacherUserIds = await User.find({ role: 'teacher' }).distinct('_id');
    const posts = await Post.find({
      status: 'approved',
      user_id: { $in: teacherUserIds },
      class_id: { $in: classIds }
    })
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id')
      .sort({ create_at: -1 });

    // Thêm dữ liệu ảnh, like, comment nếu muốn giống parent
    const postsWithDetails = await Promise.all(posts.map(async post => {
      const images = await PostImage.find({ post_id: post._id });
      const likeCount = await PostLike.countDocuments({ post_id: post._id });
      const commentCount = await PostComment.countDocuments({ post_id: post._id });
      let isLiked = false; // Nếu đã login thì kiểm tra, nếu muốn
      if (req.user.id) {
        isLiked = !!(await PostLike.findOne({ post_id: post._id, user_id: req.user.id }));
      }
      return {
        ...post.toObject(),
        images: images.map(img => img.image_url),
        like_count: likeCount,
        comment_count: commentCount,
        is_liked: isLiked
      };
    }));
    res.json({ success: true, data: postsWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy post', error: error.message });
  }
};

// GET /api/teachers/posts - Giáo viên xem tất cả các post (parent & teacher & school_admin) trong lớp của mình
const getAllPostsForTeacher = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không tìm thấy giáo viên.' 
      });
    }

    // Lấy thông tin user để kiểm tra school_id
    const currentUser = await User.findById(userId).select('school_id');
    if (!currentUser || !currentUser.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được trường của giáo viên'
      });
    }
    const schoolId = currentUser.school_id;

    // Lấy classes mà giáo viên quản lý (chỉ trong cùng school)
    const classes = await Class.find({ 
      $or: [
        { teacher_id: teacher._id },
        { teacher_id2: teacher._id }
      ],
      school_id: schoolId
    });
    const classIds = classes.map(c => c._id);
    if (!classIds.length) {
      return res.json({ 
        success: true, 
        data: [], 
        message: 'Bạn chưa được phân lớp.' 
      });
    }

    // Tạo điều kiện OR để cho phép xem:
    const orConditions = [];
    
    // Điều kiện 1: Bài viết của trường (school_admin) - TẤT CẢ user thấy
    const schoolUserIds = await User.find({ 
      role: { $in: ['school_admin'] },
      school_id: schoolId 
    }).distinct('_id');
    orConditions.push({
      'user_id': { $in: schoolUserIds }
    });
    
    // Điều kiện 2: Bài viết của phụ huynh - TẤT CẢ user thấy
    const parentUserIds = await User.find({ 
      role: 'parent',
      school_id: schoolId 
    }).distinct('_id');
    orConditions.push({
      'user_id': { $in: parentUserIds }
    });
    
    // Điều kiện 3: Bài viết của giáo viên - CHỈ trong phạm vi lớp giáo viên quản lý
    const teacherUserIds = await User.find({ 
      role: 'teacher',
      school_id: schoolId 
    }).distinct('_id');
    if (classIds.length > 0) {
      orConditions.push({
        'user_id': { $in: teacherUserIds },
        'class_id': { $in: classIds }
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

    // Tạo filter với status approved và điều kiện OR
    const filter = {
      status: 'approved',
      $or: orConditions
    };

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
        let isLiked = false;
        if (userId) {
          const userLike = await PostLike.findOne({ 
            post_id: post._id, 
            user_id: userId 
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
      message: 'Lỗi lấy bài đăng lớp', 
      error: error.message 
    });
  }
};

// PUT /api/teachers/posts/:postId - Cập nhật bài post (chỉ được update bài của mình)
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, images } = req.body;
    const userId = req.user.id;

    // Kiểm tra post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Kiểm tra xem user có phải chủ sở hữu của post không
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa bài viết này'
      });
    }

    // Kiểm tra xem có thay đổi gì không
    let hasChanges = false;
    
    // Cập nhật content
    if (content && content !== post.content) {
      post.content = content;
      hasChanges = true;
    }

    // Xử lý images nếu có
    if (images && Array.isArray(images)) {
      // Kiểm tra xem có thay đổi ảnh không
      const currentImages = await PostImage.find({ post_id: postId });
      const currentImageUrls = currentImages.map(img => img.image_url).sort();
      const newImageUrls = images.filter(img => img.startsWith('http')).sort();
      
      // So sánh số lượng và URL để phát hiện thay đổi
      if (currentImageUrls.length !== newImageUrls.length ||
          !currentImageUrls.every((url, idx) => url === newImageUrls[idx])) {
        hasChanges = true;
      }
      
      // Xóa các ảnh cũ
      await PostImage.deleteMany({ post_id: postId });

      // Upload ảnh mới nếu có
      if (images.length > 0) {
        const uploadedImages = await Promise.all(
          images.map(async (image) => {
            try {
              // Kiểm tra xem là URL hay base64
              if (image.startsWith('http')) {
                return image; // Đã là URL
              }
              
              const result = await cloudinary.uploader.upload(image, {
                folder: 'posts',
                resource_type: 'image',
              });
              return result.secure_url;
            } catch (error) {
              console.error('Error uploading image:', error);
              return null;
            }
          })
        );

        // Lưu ảnh mới vào database
        await Promise.all(
          uploadedImages
            .filter(url => url !== null)
            .map(url => PostImage.create({
              post_id: postId,
              image_url: url
            }))
        );
      }
    }

    // Giáo viên update vẫn giữ status approved (không cần duyệt lại)
    await post.save();

    // Lấy post đã cập nhật với full details
    const updatedPost = await Post.findById(postId)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id');

    const postImages = await PostImage.find({ post_id: postId });

    res.json({
      success: true,
      data: {
        ...updatedPost.toObject(),
        images: postImages.map(img => img.image_url)
      },
      message: 'Cập nhật bài viết thành công'
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật bài đăng',
      error: error.message
    });
  }
};

// DELETE /api/teachers/posts/:postId - Xóa bài post (chỉ được xóa bài của mình)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Kiểm tra post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Kiểm tra xem user có phải chủ sở hữu của post không
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bài viết này'
      });
    }

    // Xóa tất cả hình ảnh liên quan
    const postImages = await PostImage.find({ post_id: postId });
    if (postImages.length > 0) {
      // Xóa ảnh từ database
      await PostImage.deleteMany({ post_id: postId });
    }

    // Xóa tất cả like liên quan
    await PostLike.deleteMany({ post_id: postId });

    // Xóa tất cả comment liên quan
    await PostComment.deleteMany({ post_id: postId });

    // Xóa post
    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Xóa bài viết thành công'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa bài đăng',
      error: error.message
    });
  }
};

// GET /api/teachers/posts/my-posts - Lấy tất cả bài post của giáo viên hiện tại (bao gồm pending và approved)
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedUserId = req.query.user_id; // Cho phép lấy posts của user_id trong query
    
    // Nếu có user_id trong query, kiểm tra xem có phải user hiện tại không
    const targetUserId = requestedUserId && requestedUserId === userId ? requestedUserId : userId;

    // Lấy tất cả posts của user (bao gồm pending và approved)
    const posts = await Post.find({ user_id: targetUserId })
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
        let isLiked = false;
        if (userId) {
          const userLike = await PostLike.findOne({ 
            post_id: post._id, 
            user_id: userId 
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
    console.error('Error getting my posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài đăng của bạn',
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getAllTeacherPostsForParent,
  getAllPostsForTeacher,
  updatePost,
  deletePost,
  getMyPosts,
};
