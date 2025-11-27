const User = require('../models/User');
const bcrypt = require('bcryptjs');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
const PASSWORD_MESSAGE = 'Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';

const isStrongPassword = (password = '') => PASSWORD_REGEX.test(password);

// GET /api/users - Lấy danh sách tất cả users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    
    // Tạo filter object
    const filter = {};
    if (role) filter.role = role;
    if (status !== undefined) filter.status = parseInt(status);
    
    // Tính toán pagination
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password_hash') // Loại bỏ password_hash khỏi response
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users',
      error: error.message
    });
  }
};

// GET /api/users/:id - Lấy thông tin user theo ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password_hash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: error.message
    });
  }
};

// POST /api/users - Tạo user mới
const createUser = async (req, res) => {
  try {
    const { full_name, username, password, role, email, phone_number, avatar_url } = req.body;
    
    // Kiểm tra username đã tồn tại chưa
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }
    }
    
    // Kiểm tra email đã tồn tại chưa (nếu có)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_MESSAGE
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Tạo user mới
    const newUser = new User({
      full_name,
      username,
      password_hash,
      role,
      email,
      phone_number,
      avatar_url: avatar_url || 'https://via.placeholder.com/150',
      status: 1
    });
    
    const savedUser = await newUser.save();
    
    // Loại bỏ password_hash khỏi response
    const userResponse = savedUser.toObject();
    delete userResponse.password_hash;
    
    res.status(201).json({
      success: true,
      message: 'Tạo user thành công',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo user',
      error: error.message
    });
  }
};

// PUT /api/users/:id - Cập nhật user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, password, role, email, phone_number, avatar_url, status } = req.body;
    
    // Kiểm tra user có tồn tại không
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Kiểm tra username đã tồn tại chưa (nếu có thay đổi)
    if (username && username !== existingUser.username) {
      const duplicateUsername = await User.findOne({ username, _id: { $ne: id } });
      if (duplicateUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }
    }
    
    // Kiểm tra email đã tồn tại chưa (nếu có thay đổi)
    if (email && email !== existingUser.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: id } });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }
    }
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (email) updateData.email = email;
    if (phone_number) updateData.phone_number = phone_number;
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (status !== undefined) updateData.status = parseInt(status);
    
    // Hash password mới nếu có
    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({
          success: false,
          message: PASSWORD_MESSAGE
        });
      }
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash');
    
    res.json({
      success: true,
      message: 'Cập nhật user thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật user',
      error: error.message
    });
  }
};

// DELETE /api/users/:id - Xóa user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Soft delete - chỉ thay đổi status thành 0
    await User.findByIdAndUpdate(id, { status: 0 });
    
    res.json({
      success: true,
      message: 'Xóa user thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user',
      error: error.message
    });
  }
};

// DELETE /api/users/:id/hard - Xóa user vĩnh viễn
const hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Xóa user vĩnh viễn thành công'
    });
  } catch (error) {
    console.error('Error hard deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user vĩnh viễn',
      error: error.message
    });
  }
};

// PUT /api/users/:id/restore - Khôi phục user đã bị xóa
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    await User.findByIdAndUpdate(id, { status: 1 });
    
    res.json({
      success: true,
      message: 'Khôi phục user thành công'
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi khôi phục user',
      error: error.message
    });
  }
};

// GET /api/users/me - Lấy thông tin tài khoản hiện tại
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy thông tin tài khoản', error: error.message });
  }
};

// PUT /api/users/me - Cập nhật thông tin tài khoản hiện tại
const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username, email, phone_number, avatar_url } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (username && username !== user.username) {
      const duplicateUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (duplicateUsername) {
        return res.status(400).json({ success: false, message: 'Username đã tồn tại' });
      }
    }

    if (email && email !== user.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (duplicateEmail) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      }
    }

    if (phone_number && phone_number !== user.phone_number) {
      const duplicatePhone = await User.findOne({ phone_number, _id: { $ne: userId } });
      if (duplicatePhone) {
        return res.status(400).json({ success: false, message: 'Số điện thoại đã tồn tại' });
      }
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password_hash');
    return res.json({ success: true, message: 'Cập nhật thông tin thành công', data: updatedUser });
  } catch (error) {
    console.error('Error updating current user:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật thông tin', error: error.message });
  }
};

// PUT /api/users/change-password - Đổi mật khẩu tài khoản hiện tại
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại' });
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: PASSWORD_MESSAGE });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: 'Tài khoản chưa thiết lập mật khẩu' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const saltRounds = 12;
    user.password_hash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Không thể đổi mật khẩu', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser,
  getCurrentUser,
  updateCurrentUser,
  changePassword
};
