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

// --- Lấy danh sách tất cả phụ huynh trong trường ---
exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate({
        path: 'user_id',
        select: 'full_name email phone_number address avatar_url',
      })
      .lean();

    return res.json(parents);
  } catch (err) {
    console.error('getAllParents error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

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
      username,
      password,
    } = req.body;

    if (!full_name || !phone || !student_id || !relationship) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra xem học sinh đã có bố hoặc mẹ chưa (tùy theo relationship)
    if (relationship === 'father' || relationship === 'mother') {
      const existingParentWithSameRelation = await ParentStudent.findOne({
        student_id: student_id,
        relationship: relationship
      });
      
      if (existingParentWithSameRelation) {
        const relationshipName = relationship === 'father' ? 'bố' : 'mẹ';
        return res.status(400).json({ 
          message: `Học sinh này đã có ${relationshipName}. Mỗi học sinh chỉ có thể có 1 ${relationshipName}.` 
        });
      }
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
      let finalUsername;
      let finalPasswordHash;
      
      if (createAccount && username && password) {
        // Sử dụng username và password do admin nhập vào
        finalUsername = username.trim();
        finalPasswordHash = await bcrypt.hash(password, 10);
        
        // Kiểm tra username đã tồn tại chưa
        const existingUsername = await User.findOne({ username: finalUsername });
        if (existingUsername) {
          return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }
      } else {
        // Không tạo account - để username và password null
        finalUsername = null;
        finalPasswordHash = null;
      }
      
      const userStatus = createAccount ? 1 : 0; // nếu không tạo account thì để inactive
      const avatar_url = req.body.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name || 'Parent')}&background=random`;
      const newUser = await User.create({
        full_name,
        username: finalUsername,
        password_hash: finalPasswordHash,
        role: 'parent',
        avatar_url,
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
      // Kiểm tra nếu đổi sang father/mother, học sinh đã có chưa
      if (relationship === 'father' || relationship === 'mother') {
        const existingWithSameRelation = await ParentStudent.findOne({
          student_id: student_id,
          relationship: relationship,
          parent_id: { $ne: id } // Không phải parent hiện tại
        });
        
        if (existingWithSameRelation) {
          const relationshipName = relationship === 'father' ? 'bố' : 'mẹ';
          return res.status(400).json({ 
            message: `Học sinh này đã có ${relationshipName}. Không thể thay đổi mối quan hệ.` 
          });
        }
      }
      
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

// --- Liên kết phụ huynh có sẵn với học sinh ---
exports.linkExistingParent = async (req, res) => {
  try {
    const { parent_id, student_id, relationship } = req.body;

    if (!parent_id || !student_id || !relationship) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (!mongoose.isValidObjectId(parent_id) || !mongoose.isValidObjectId(student_id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    // Kiểm tra parent tồn tại
    const parent = await Parent.findById(parent_id);
    if (!parent) {
      return res.status(404).json({ message: 'Không tìm thấy phụ huynh' });
    }

    // Kiểm tra xem học sinh đã có bố hoặc mẹ chưa (tùy theo relationship)
    if (relationship === 'father' || relationship === 'mother') {
      const existingParentWithSameRelation = await ParentStudent.findOne({
        student_id: student_id,
        relationship: relationship
      });
      
      if (existingParentWithSameRelation) {
        const relationshipName = relationship === 'father' ? 'bố' : 'mẹ';
        return res.status(400).json({ 
          message: `Học sinh này đã có ${relationshipName}. Mỗi học sinh chỉ có thể có 1 ${relationshipName}.` 
        });
      }
    }

    // Kiểm tra relationship đã tồn tại chưa
    const existingRelationship = await ParentStudent.findOne({
      parent_id: parent_id,
      student_id: student_id,
    });

    if (existingRelationship) {
      return res.status(400).json({ message: 'Phụ huynh này đã được liên kết với học sinh' });
    }

    // Tạo relationship mới
    await ParentStudent.create({
      parent_id: parent_id,
      student_id: student_id,
      relationship: relationship,
    });

    return res.status(201).json({
      message: 'Liên kết phụ huynh thành công',
    });
  } catch (err) {
    console.error('linkExistingParent error:', err);
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

    // Nếu không còn relationship nào, xóa parent và user
    if (remainingRelationships === 0) {
      const parent = await Parent.findById(id);
      if (parent && parent.user_id) {
        // Xóa user
        await User.findByIdAndDelete(parent.user_id);
        // Xóa parent
        await Parent.findByIdAndDelete(id);
      }
    }

    return res.json({ message: 'Xóa phụ huynh thành công' });
  } catch (err) {
    console.error('deleteParent error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};
