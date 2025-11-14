const mongoose = require('mongoose');
const Parent = require('../models/Parent');
const ParentStudent = require('../models/ParentStudent');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

function sanitizeUsername(base) {
  return (base || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

async function generateUniqueUsername({ email, phone }) {
  // Prefer phone digits, else email local part, else timestamp
  const phoneDigits = (phone || '').replace(/\D/g, '');
  let base = '';
  if (phoneDigits) {
    base = `ph${phoneDigits.slice(-9)}`; // last digits
  } else if (email) {
    base = email.split('@')[0];
  } else {
    base = `parent${Date.now()}`;
  }
  base = sanitizeUsername(base) || `parent${Date.now()}`;

  // Ensure uniqueness
  let username = base;
  let suffix = 0;
  // Loop with a cap to avoid infinite
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await User.findOne({ username }).select('_id').lean();
    if (!exists) return username;
    suffix += 1;
    username = `${base}${suffix}`;
  }
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
    } = req.body;

    if (!full_name || !phone || !student_id || !relationship) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra xem parent đã tồn tại chưa (qua phone hoặc email)
    let existingUser = null;
    if (email) {
      existingUser = await User.findOne({ email, role: 'parent' });
    }
    if (!existingUser && phone) {
      existingUser = await User.findOne({ phone_number: phone, role: 'parent' });
    }

    let parentId;

    if (existingUser) {
      // Parent đã tồn tại, chỉ cần tạo relationship
      const existingParent = await Parent.findOne({ user_id: existingUser._id });
      if (!existingParent) {
        const newParent = await Parent.create({ user_id: existingUser._id });
        parentId = newParent._id;
      } else {
        parentId = existingParent._id;
      }
    } else {
      // Tạo user mới cho parent
      const username = await generateUniqueUsername({ email, phone });
      const defaultPasswordHash = await bcrypt.hash('123456', 10);
      const userStatus = createAccount ? 1 : 0; // nếu không tạo account thì để inactive
      const newUser = await User.create({
        full_name,
        username,
        password_hash: defaultPasswordHash,
        role: 'parent',
        avatar_url: '',
        status: userStatus,
        email: email || null,
        phone_number: phone,
        address
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
