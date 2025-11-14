const mongoose = require('mongoose');
const Parent = require('../models/Parent');
const ParentStudent = require('../models/ParentStudent');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/passwordPolicy');

function sanitizeUsername(base) {
  return (base || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

// --- Tạo mới phụ huynh ---
exports.createParent = async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      address,
      relationship,
      student_id,
      createAccount,
      password,
      username,
      avatar_url,
      status,
    } = req.body;

    if (!full_name || !phone || !student_id || !relationship) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (!mongoose.isValidObjectId(student_id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const sanitizedUsername = username ? sanitizeUsername(username) : null;
    if (sanitizedUsername && sanitizedUsername.length < 4) {
      return res.status(400).json({ message: 'Username phải từ 4 ký tự và không chứa ký tự đặc biệt ngoài ._-'} );
    }

    // Kiểm tra xem parent đã tồn tại chưa (qua phone hoặc email)
    let existingUser = null;
    if (email) {
      existingUser = await User.findOne({ email, role: 'parent' });
    }
    if (!existingUser && phone) {
      existingUser = await User.findOne({ phone_number: phone, role: 'parent' });
    }

    if (!existingUser && createAccount && (!password || !password.trim())) {
      return res.status(400).json({ message: 'Mật khẩu là bắt buộc để tạo tài khoản phụ huynh' });
    }

    if (password && password.trim()) {
      const passwordValidation = validatePassword(password.trim());
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
    }

    let parentId;

    if (existingUser) {
      // cập nhật thông tin và dùng lại account
      const updateExisting = {};
      if (full_name) updateExisting.full_name = full_name;
      if (phone) updateExisting.phone_number = phone;
      if (email !== undefined) updateExisting.email = email;
      if (address !== undefined) updateExisting.address = address;
      if (avatar_url !== undefined) updateExisting.avatar_url = avatar_url;
      if (status !== undefined) {
        updateExisting.status = status;
      } else if (createAccount) {
        updateExisting.status = 1;
      }
      if (password && password.trim()) {
        updateExisting.password_hash = await bcrypt.hash(password.trim(), 10);
      }
      if (Object.keys(updateExisting).length > 0) {
        await User.findByIdAndUpdate(existingUser._id, updateExisting);
      }

      const existingParent = await Parent.findOne({ user_id: existingUser._id });
      if (!existingParent) {
        const newParent = await Parent.create({ user_id: existingUser._id });
        parentId = newParent._id;
      } else {
        parentId = existingParent._id;
      }
    } else {
      // Tạo user mới cho parent
      if (!sanitizedUsername) {
        return res.status(400).json({ message: 'Vui lòng nhập username hợp lệ cho phụ huynh mới' });
      }
      const usernameExists = await User.findOne({ username: sanitizedUsername }).select('_id').lean();
      if (usernameExists) {
        return res.status(400).json({ message: 'Username đã tồn tại, vui lòng chọn tên khác' });
      }
      const plainPassword = password && password.trim() ? password.trim() : 'Abc@1234';
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const userStatus = status !== undefined ? status : (createAccount ? 1 : 0);
      const newUser = await User.create({
        full_name,
        username: sanitizedUsername,
        password_hash: passwordHash,
        role: 'parent',
        avatar_url: avatar_url || '',
        status: userStatus,
        email: email || null,
        phone_number: phone,
        address: address || null
      });

      // Tạo parent
      const newParent = await Parent.create({
        user_id: newUser._id,
      });
      parentId = newParent._id;
    }

    // Kiểm tra relationship đã tồn tại chưa
    const existingRelationship = await ParentStudent.findOne({
      parent_id: parentId,
      student_id: student_id,
    });

    if (existingRelationship) {
      return res.status(400).json({ message: 'Phụ huynh này đã được thêm cho học sinh' });
    }

    // Tạo relationship mới
    await ParentStudent.create({
      parent_id: parentId,
      student_id: student_id,
      relationship: relationship,
    });

    return res.status(201).json({
      message: 'Tạo phụ huynh thành công',
    });
  } catch (err) {
    console.error('createParent error:', err);
    console.error('Error stack:', err.stack);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Phụ huynh này đã được gán cho học sinh', error: err.message });
    }
    if (err?.name === 'CastError') {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: err.message });
    }
    if (err?.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors || {}).map(e => e.message).join(', ');
      return res.status(400).json({ message: `Lỗi validation: ${validationErrors}`, error: err.message });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Cập nhật phụ huynh ---
exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params; // parent_id
    const {
      full_name,
      phone,
      email,
      address,
      relationship,
      student_id,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'parent_id không hợp lệ' });
    }

    const parent = await Parent.findById(id);
    if (!parent) {
      return res.status(404).json({ message: 'Không tìm thấy phụ huynh' });
    }

    // Cập nhật user info
    const updateUserData = {};
    if (full_name) updateUserData.full_name = full_name;
    if (email !== undefined) updateUserData.email = email;
    if (phone) updateUserData.phone_number = phone;
    if (address !== undefined) updateUserData.address = address;

    await User.findByIdAndUpdate(parent.user_id, updateUserData);

    // Cập nhật relationship nếu có student_id
    if (relationship && student_id) {
      await ParentStudent.findOneAndUpdate(
        { parent_id: id, student_id: student_id },
        { relationship: relationship }
      );
    }

    return res.json({ message: 'Cập nhật phụ huynh thành công' });
  } catch (err) {
    console.error('updateParent error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// --- Xóa phụ huynh (xóa relationship với student cụ thể) ---
exports.deleteParent = async (req, res) => {
  try {
    const { id } = req.params; // parent_id
    const { student_id } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'parent_id không hợp lệ' });
    }

    if (!student_id) {
      return res.status(400).json({ message: 'student_id là bắt buộc' });
    }

    // Xóa relationship giữa parent và student này
    await ParentStudent.deleteOne({ parent_id: id, student_id: student_id });

    // Kiểm tra xem parent còn liên kết với student nào khác không
    const remainingRelationships = await ParentStudent.countDocuments({ parent_id: id });

    // Nếu không còn relationship nào, có thể soft delete user (optional)
    if (remainingRelationships === 0) {
      const parent = await Parent.findById(id);
      if (parent) {
        await User.findByIdAndUpdate(parent.user_id, { status: 0 });
      }
    }

    return res.json({ message: 'Xóa phụ huynh thành công' });
  } catch (err) {
    console.error('deleteParent error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
