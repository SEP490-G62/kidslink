import bcrypt from "bcryptjs";
import User from "../models/User.js";

// GET /api/users
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status !== undefined) filter.status = parseInt(status);

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select("-password_hash")
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
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// GET /api/users/:id
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password_hash");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// POST /api/users
export async function createUser(req, res) {
  try {
    const { full_name, username, password, role, email, phone_number, avatar_url } = req.body;

    if (await User.findOne({ username }))
      return res.status(400).json({ success: false, message: "Username đã tồn tại" });
    if (email && (await User.findOne({ email })))
      return res.status(400).json({ success: false, message: "Email đã tồn tại" });

    const password_hash = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      full_name,
      username,
      password_hash,
      role,
      email,
      phone_number,
      avatar_url: avatar_url || "https://via.placeholder.com/150",
      status: 1,
    });

    const { password_hash: _, ...userData } = newUser.toObject();
    res.status(201).json({ success: true, message: "Tạo user thành công", data: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// PUT /api/users/:id
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { full_name, username, password, role, email, phone_number, avatar_url, status } = req.body;

    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy user" });

    const updateData = { full_name, username, role, email, phone_number, avatar_url };
    if (status !== undefined) updateData.status = parseInt(status);
    if (password) updateData.password_hash = await bcrypt.hash(password, 12);

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password_hash");
    res.json({ success: true, message: "Cập nhật thành công", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// DELETE /api/users/:id (soft delete)
export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });

    await User.findByIdAndUpdate(req.params.id, { status: 0 });
    res.json({ success: true, message: "Xóa user thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// DELETE /api/users/:id/hard
export async function hardDeleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Xóa vĩnh viễn thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}

// PUT /api/users/:id/restore
export async function restoreUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });

    await User.findByIdAndUpdate(req.params.id, { status: 1 });
    res.json({ success: true, message: "Khôi phục user thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
}
