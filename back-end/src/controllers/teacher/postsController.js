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

// 1. Giáo viên tạo bài đăng
const createPost = async (req, res) => {
  try {
    const { content, images } = req.body;
    const userId = req.user.id;

    const teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) return res.status(403).json({ success: false, message: 'Không tìm thấy giáo viên' });

    // Lấy lớp mà giáo viên phụ trách (teacher_id hoặc teacher_id2)
    const teacherClass = await Class.findOne({ $or: [ { teacher_id: teacher._id }, { teacher_id2: teacher._id } ] });
    if (!teacherClass) return res.status(404).json({ success: false, message: 'Bạn không phụ trách lớp nào!' });

    const newPost = await Post.create({
      content,
      user_id: userId,
      class_id: teacherClass._id,
      status: 'approved',
      create_at: new Date()
    });

    // Upload hình nếu có
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
      await Promise.all(
        uploadedImages.filter(u => u !== null).map(url => PostImage.create({ post_id: newPost._id, image_url: url }))
      );
    }

    const detail = await Post.findById(newPost._id)
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id');
    res.json({ success: true, data: detail, message: 'Đăng bài thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo bài đăng', error: error.message });
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

// Giáo viên xem tất cả các post (parent & teacher) trong lớp của mình
const getAllPostsForTeacher = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher)
      return res.status(403).json({ success: false, message: 'Không tìm thấy giáo viên.' });

    // Lấy classes mà giáo viên quản lý
    const classes = await Class.find({ $or: [
      { teacher_id: teacher._id },
      { teacher_id2: teacher._id }
    ] });
    const classIds = classes.map(c => c._id);
    if (!classIds.length)
      return res.json({ success: true, data: [], message: 'Bạn chưa được phân lớp.' });

    // Tìm tất cả post trong các lớp này (mặc định status=approved mới được xem)
    const posts = await Post.find({
      class_id: { $in: classIds },
      status: 'approved'
    })
      .populate('user_id', 'full_name username avatar_url role')
      .populate('class_id', 'class_name class_age_id')
      .sort({ create_at: -1 });

    // Gắn detail (images, like-count, comment-count, is_liked)
    const postsWithDetails = await Promise.all(posts.map(async post => {
      const images = await PostImage.find({ post_id: post._id });
      const likeCount = await PostLike.countDocuments({ post_id: post._id });
      const commentCount = await PostComment.countDocuments({ post_id: post._id });
      let isLiked = false;
      if (userId) {
        isLiked = !!(await PostLike.findOne({ post_id: post._id, user_id: userId }));
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
    res.status(500).json({ success: false, message: 'Lỗi lấy bài đăng lớp', error: error.message });
  }
};

// (Có thể supplement thêm: updatePost, deletePost giống parent, nhưng kiểm tra quyền là teacher chủ bài đó)

module.exports = {
  createPost,
  getAllTeacherPostsForParent,
  getAllPostsForTeacher,
};
