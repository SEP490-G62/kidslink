const Post = require('../../models/Post');
const PostImage = require('../../models/PostImage');
const PostLike = require('../../models/PostLike');
const PostComment = require('../../models/PostComment');
const User = require('../../models/User');
const Parent = require('../../models/Parent');
const ParentStudent = require('../../models/ParentStudent');
const StudentClass = require('../../models/StudentClass');
const Class = require('../../models/Class');
const cloudinary = require('../../utils/cloudinary');


// GET /api/parent/posts - Lấy tất cả các bài post cho phụ huynh
const getAllPosts = async (req, res) => {
  try {
    // Tạo filter object với trạng thái approved mặc định
    const filter = { status: 'approved' };
    
    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: req.user.id });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }
    // Lấy thông tin user để kiểm tra school_id
    const currentUser = await User.findById(req.user.id).select('school_id');
    if (!currentUser || !currentUser.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được trường của phụ huynh'
      });
    }
    const schoolId = currentUser.school_id;
    
    // Lấy student_id từ query string nếu có (filter by child)
    const studentId = req.query.student_id;
    
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
    
    // Lọc theo child cụ thể nếu có
    let filterStudentIds = studentIds;
    if (studentId) {
      // Kiểm tra studentId có thuộc về parent không
      if (studentIds.some(id => id.toString() === studentId)) {
        filterStudentIds = [studentId];
      }
    }
    
    // Tự động lấy danh sách lớp học của các học sinh (chỉ lớp có năm học lớn nhất)
    const studentClasses = await StudentClass.find({ student_id: { $in: filterStudentIds } })
      .populate({
        path: 'class_id',
        select: 'class_name class_age_id academic_year'
      });
    
    // Nhóm theo student_id và lấy lớp có năm học lớn nhất cho mỗi học sinh
    const studentClassMap = {};
    studentClasses.forEach(sc => {
      const studentId = sc.student_id.toString();
      if (!studentClassMap[studentId] || 
          sc.class_id.academic_year > studentClassMap[studentId].class_id.academic_year) {
        studentClassMap[studentId] = sc;
      }
    });
    
    const childrenClassIds = Object.values(studentClassMap).map(sc => sc.class_id._id);
    
    // Tạo điều kiện OR để cho phép xem:
    const orConditions = [];
    
    // Điều kiện 1: Bài viết của trường (school_admin) - TẤT CẢ user thấy
    const schoolUserIds = await User.find({ role: { $in: ['school_admin'] }, school_id: schoolId }).distinct('_id');
    orConditions.push({
      'user_id': { $in: schoolUserIds }
    });
    
    // Điều kiện 2: Bài viết của phụ huynh - TẤT CẢ user thấy
    const parentUserIds = await User.find({ role: 'parent', school_id: schoolId }).distinct('_id');
    orConditions.push({
      'user_id': { $in: parentUserIds }
    });
    
    // Điều kiện 3: Bài viết của giáo viên - CHỈ trong phạm vi lớp con học và lớp có năm học lớn nhất
    const teacherUserIds = await User.find({ role: 'teacher', school_id: schoolId }).distinct('_id');
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


// POST /api/parent/posts - Tạo bài post mới
const createPost = async (req, res) => {
  try {
    const { content, images, student_id } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bài viết'
      });
    }

    // Lấy thông tin phụ huynh
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Lấy danh sách học sinh của phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id });
    const studentIds = parentStudents.map(ps => ps.student_id);

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phụ huynh chưa có con học tại trường'
      });
    }

    // Xác định lớp học để đăng bài
    let targetClassId = null;
    
    if (student_id) {
      // Kiểm tra student_id có thuộc về parent không
      if (!studentIds.some(id => id.toString() === student_id)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền đăng bài cho học sinh này'
        });
      }
      
      // Lấy lớp học của học sinh cụ thể (lớp lớn nhất theo năm học)
      const studentClasses = await StudentClass.find({ student_id })
        .populate({
          path: 'class_id',
          select: 'class_name class_age_id academic_year'
        });
      
      const studentClass = studentClasses.length > 0 
        ? studentClasses.sort((a, b) => {
            const yearA = a.class_id.academic_year;
            const yearB = b.class_id.academic_year;
            return yearB.localeCompare(yearA); // Sắp xếp năm học giảm dần
          })[0]
        : null;
      
      if (!studentClass) {
        return res.status(400).json({
          success: false,
          message: 'Học sinh chưa được phân lớp'
        });
      }
      
      targetClassId = studentClass.class_id._id;
    } else {
      // Nếu không có student_id, lấy lớp của con đầu tiên (con lớn nhất theo năm học)
      const allStudentClasses = await StudentClass.find({ student_id: { $in: studentIds } })
        .populate({
          path: 'class_id',
          select: 'class_name class_age_id academic_year'
        });
      
      if (allStudentClasses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có con nào được phân lớp'
        });
      }
      
      // Sắp xếp theo năm học giảm dần và lấy lớp lớn nhất
      const sortedClasses = allStudentClasses.sort((a, b) => {
        const yearA = a.class_id.academic_year;
        const yearB = b.class_id.academic_year;
        return yearB.localeCompare(yearA); // Sắp xếp năm học giảm dần
      });
      
      targetClassId = sortedClasses[0].class_id._id;
    }

    // Kiểm tra lớp học có tồn tại không
    const classExists = await Class.findById(targetClassId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Lớp học không tồn tại'
      });
    }

    // Tạo post
    const newPost = await Post.create({
      content,
      user_id: userId,
      class_id: targetClassId,
      status: 'pending',
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

// PUT /api/parent/posts/:postId - Cập nhật bài post (chỉ được update bài của mình)
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

    // Khi update bài viết (content hoặc images), chuyển về trạng thái pending để cần duyệt lại
    if (hasChanges) {
      post.status = 'pending';
    }

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

// GET /api/parent/children - Lấy danh sách con của phụ huynh
const getChildren = async (req, res) => {
  try {
    const ParentStudent = require('../../models/ParentStudent');
    const Student = require('../../models/Student');
    const StudentClass = require('../../models/StudentClass');
    const Class = require('../../models/Class');
    
    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: req.user.id });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }
    
    // Lấy danh sách học sinh của phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id })
      .populate('student_id');
    
    if (parentStudents.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Phụ huynh chưa có con học tại trường'
      });
    }
    
    // Lấy thông tin chi tiết từng con bao gồm lớp học
    const childrenWithClasses = await Promise.all(
      parentStudents.map(async (ps) => {
        const student = ps.student_id;
        
        // Lấy lớp học hiện tại của học sinh (lớp lớn nhất theo năm học)
        const studentClasses = await StudentClass.find({ student_id: student._id })
          .populate({
            path: 'class_id',
            select: 'class_name class_age_id academic_year'
          });
        
        // Sắp xếp theo năm học giảm dần và lấy lớp lớn nhất
        const studentClass = studentClasses.length > 0 
          ? studentClasses.sort((a, b) => {
              const yearA = a.class_id.academic_year;
              const yearB = b.class_id.academic_year;
              return yearB.localeCompare(yearA); // Sắp xếp năm học giảm dần
            })[0]
          : null;
        
        return {
          _id: student._id,
          full_name: student.full_name,
          dob: student.dob,
          gender: student.gender,
          avatar_url: student.avatar_url,
          status: student.status,
          allergy: student.allergy,
          relationship: ps.relationship,
          class: studentClass ? {
            _id: studentClass.class_id._id,
            class_name: studentClass.class_id.class_name,
            class_age_id: studentClass.class_id.class_age_id,
            academic_year: studentClass.class_id.academic_year
          } : null
        };
      })
    );
    
    // Sắp xếp theo tuổi (con lớn nhất trước)
    childrenWithClasses.sort((a, b) => {
      const dateA = new Date(a.dob);
      const dateB = new Date(b.dob);
      return dateA - dateB; // Trẻ hơn = lớn hơn theo thứ tự
    });
    
    res.json({
      success: true,
      data: childrenWithClasses
    });
  } catch (error) {
    console.error('Error getting children:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách con',
      error: error.message
    });
  }
};

// DELETE /api/parent/posts/:postId - Xóa bài post (chỉ được xóa bài của mình)
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
      // Xóa ảnh từ Cloudinary (nếu cần)
      // await Promise.all(
      //   postImages.map(img => cloudinary.uploader.destroy(img.public_id))
      // );
      
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

// GET /api/parent/posts/my-posts - Lấy tất cả bài post của user hiện tại (bao gồm pending và approved)
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
    console.error('Error getting my posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài đăng của bạn',
      error: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  getChildren
};
