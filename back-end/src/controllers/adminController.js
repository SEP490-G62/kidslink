import User from "../models/User.js";
import bcrypt from "bcryptjs";

// 🧩 GET /admin/users — Lấy tất cả user
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password_hash"); // ẩn password
    res.json(users);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
};

// 🧩 GET /admin/users/:id — Lấy user theo ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password_hash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
};

// 🧩 POST /admin/users — Tạo user mới
export const createUser = async (req, res) => {
  try {
    const {
      full_name,
      username,
      password,
      role,
      email,
      phone_number,
      avatar_url,
      status, // 👈 thêm status
    } = req.body;

    // Kiểm tra trùng username hoặc email
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res.status(400).json({ error: "Username or email already exists" });

    // Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      full_name,
      username,
      password_hash,
      role,
      email,
      phone_number,
      avatar_url,
      status: status ?? 1, // 👈 Nếu không truyền, mặc định 1 (hoạt động)
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password_hash;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
};

// 🧩 PUT /admin/users/:id — Cập nhật user
export const updateUser = async (req, res) => {
  try {
    const { password, ...updates } = req.body;

    // Nếu có mật khẩu mới, mã hóa lại
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password_hash");

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
};

// 🧩 DELETE /admin/users/:id — Xóa user
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
};
