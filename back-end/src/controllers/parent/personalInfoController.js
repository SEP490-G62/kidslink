const Parent = require('../../models/Parent');
const User = require('../../models/User');
const ParentStudent = require('../../models/ParentStudent');
const Student = require('../../models/Student');
const bcrypt = require('bcryptjs');
const cloudinary = require('../../utils/cloudinary');

/**
 * GET /api/parent/personal-info - Lấy thông tin cá nhân của phụ huynh
 */
const getPersonalInfo = async (req, res) => {
  try {
    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: req.user.id });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Lấy thông tin user
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Lấy danh sách con của phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id })
      .populate('student_id', 'full_name dob gender avatar_url');

    const children = parentStudents.map(ps => ({
      _id: ps.student_id._id,
      full_name: ps.student_id.full_name,
      dob: ps.student_id.dob,
      gender: ps.student_id.gender,
      avatar_url: ps.student_id.avatar_url,
      relationship: ps.relationship
    }));

    res.json({
      success: true,
      data: {
        parent_id: parent._id,
        user: {
          _id: user._id,
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        children
      }
    });
  } catch (error) {
    console.error('Error getting personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin cá nhân',
      error: error.message
    });
  }
};

/**
 * PUT /api/parent/personal-info - Cập nhật thông tin cá nhân của phụ huynh
 */
const updatePersonalInfo = async (req, res) => {
  try {
    const { full_name, email, phone_number, avatar_url, password } = req.body;
    const userId = req.user.id;

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone_number) updateData.phone_number = phone_number;

    // Xử lý upload avatar lên Cloudinary nếu có
    if (avatar_url) {
      // Kiểm tra xem avatar_url là base64 hay URL
      if (avatar_url.startsWith('data:image')) {
        // Đây là base64 image, cần upload lên Cloudinary
        try {
          const result = await cloudinary.uploader.upload(avatar_url, {
            folder: 'avatars',
            resource_type: 'image',
          });
          updateData.avatar_url = result.secure_url;
        } catch (error) {
          console.error('Error uploading avatar to Cloudinary:', error);
          return res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi upload ảnh đại diện',
            error: error.message
          });
        }
      } else {
        // Đây là URL bình thường, giữ nguyên
        updateData.avatar_url = avatar_url;
      }
    }

    // Kiểm tra email đã tồn tại chưa (nếu có thay đổi email)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    // Kiểm tra phone_number đã tồn tại chưa (nếu có thay đổi phone_number)
    if (phone_number && phone_number !== user.phone_number) {
      const existingPhone = await User.findOne({ phone_number, _id: { $ne: userId } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    // Hash password mới nếu có
    if (password) {
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin cá nhân',
      error: error.message
    });
  }
};

module.exports = {
  getPersonalInfo,
  updatePersonalInfo
};

