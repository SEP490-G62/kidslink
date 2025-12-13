const { Complaint, ComplaintType, User } = require('../models');

// GET /api/school-admin/complaints - Lấy tất cả đơn của teacher và parent trong trường
// Query params: category (teacher/parent), status (pending/approve/reject)
const getAllComplaints = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { category, status } = req.query; // category: 'teacher' hoặc 'parent'
    
    // Lấy thông tin school_id của school admin
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');
    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    // Xác định roles cần lấy dựa trên category filter
    let roles = ['teacher', 'parent'];
    if (category === 'teacher') {
      roles = ['teacher'];
    } else if (category === 'parent') {
      roles = ['parent'];
    }

    // Lấy users trong cùng trường theo roles
    const schoolUsers = await User.find({
      school_id: schoolAdmin.school_id,
      role: { $in: roles }
    }).select('_id role');

    const userIds = schoolUsers.map(user => user._id);

    // Build query filter
    const query = {
      user_id: { $in: userIds },
      school_id: schoolAdmin.school_id
    };
    if (status && ['pending', 'approve', 'reject'].includes(status)) {
      query.status = status;
    }

    // Lấy tất cả complaints từ các users này
    const complaints = await Complaint.find(query)
      .select('-complaint_type_id')
      .populate('user_id', 'full_name username avatar_url role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: complaints,
      message: 'Lấy danh sách đơn thành công'
    });
  } catch (error) {
    console.error('Error getting complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách đơn',
      error: error.message
    });
  }
};

// GET /api/school-admin/complaints/:complaintId - Lấy chi tiết một đơn
const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const schoolAdminId = req.user.id;

    // Lấy thông tin school_id của school admin
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');
    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('complaint_type_id', 'name description category')
      .populate('user_id', 'full_name username avatar_url role school_id');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn'
      });
    }

    if (complaint.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn này'
      });
    }

    // Kiểm tra xem complaint có thuộc về trường của school admin không
    if (complaint.user_id.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn này'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Lấy chi tiết đơn thành công'
    });
  } catch (error) {
    console.error('Error getting complaint by id:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy chi tiết đơn',
      error: error.message
    });
  }
};

// PUT /api/school-admin/complaints/:complaintId/approve - Duyệt đơn
const approveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { response } = req.body;
    const schoolAdminId = req.user.id;

    // Lấy thông tin school_id của school admin
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');
    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('user_id', 'school_id');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn'
      });
    }

    if (complaint.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý đơn này'
      });
    }

    // Kiểm tra xem complaint có thuộc về trường của school admin không
    if (complaint.user_id.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý đơn này'
      });
    }

    // Cập nhật status và response
    complaint.status = 'approve';
    if (response && response.trim()) {
      complaint.response = response.trim();
    }
    await complaint.save();

    // Lấy lại complaint với thông tin đầy đủ
    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('complaint_type_id', 'name description category')
      .populate('user_id', 'full_name username avatar_url role');

    res.json({
      success: true,
      data: updatedComplaint,
      message: 'Duyệt đơn thành công'
    });
  } catch (error) {
    console.error('Error approving complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi duyệt đơn',
      error: error.message
    });
  }
};

// PUT /api/school-admin/complaints/:complaintId/reject - Từ chối đơn
const rejectComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { response } = req.body;
    const schoolAdminId = req.user.id;

    // Lấy thông tin school_id của school admin
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');
    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('user_id', 'school_id');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn'
      });
    }

    if (complaint.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý đơn này'
      });
    }

    // Kiểm tra xem complaint có thuộc về trường của school admin không
    if (complaint.user_id.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý đơn này'
      });
    }

    // Cập nhật status và response
    complaint.status = 'reject';
    complaint.response = response && response.trim() ? response.trim() : '';
    await complaint.save();

    // Lấy lại complaint với thông tin đầy đủ
    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('complaint_type_id', 'name description category')
      .populate('user_id', 'full_name username avatar_url role');

    res.json({
      success: true,
      data: updatedComplaint,
      message: 'Từ chối đơn thành công'
    });
  } catch (error) {
    console.error('Error rejecting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi từ chối đơn',
      error: error.message
    });
  }
};

// GET /api/school-admin/complaints/stats - Lấy thống kê đơn
const getComplaintStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    
    // Lấy thông tin school_id của school admin
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');
    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    // Lấy tất cả users (teacher và parent) trong cùng trường
    const schoolUsers = await User.find({
      school_id: schoolAdmin.school_id,
      role: { $in: ['teacher', 'parent'] }
    }).select('_id role');

    // Tách teacher và parent user IDs
    const teacherUserIds = schoolUsers.filter(u => u.role === 'teacher').map(u => u._id);
    const parentUserIds = schoolUsers.filter(u => u.role === 'parent').map(u => u._id);
    const allUserIds = schoolUsers.map(u => u._id);

    // Helper function để tính stats
    const getStats = async (userIds) => {
      const baseFilter = {
        school_id: schoolAdmin.school_id,
        user_id: userIds.length ? { $in: userIds } : { $in: [] }
      };

      const total = await Complaint.countDocuments(baseFilter);
      const pending = await Complaint.countDocuments({ ...baseFilter, status: 'pending' });
      const approved = await Complaint.countDocuments({ ...baseFilter, status: 'approve' });
      const rejected = await Complaint.countDocuments({ ...baseFilter, status: 'reject' });

      return { total, pending, approved, rejected };
    };

    // Lấy thống kê cho tất cả, teacher và parent
    const [allStats, teacherStats, parentStats] = await Promise.all([
      getStats(allUserIds),
      getStats(teacherUserIds),
      getStats(parentUserIds)
    ]);

    res.json({
      success: true,
      data: {
        all: allStats,
        teacher: teacherStats,
        parent: parentStats
      },
      message: 'Lấy thống kê đơn thành công'
    });
  } catch (error) {
    console.error('Error getting complaint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thống kê đơn',
      error: error.message
    });
  }
};

// GET /api/school-admin/complaint-types - Lấy tất cả loại đơn
const getAllComplaintTypes = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');

    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaintTypes = await ComplaintType.find({
      school_id: schoolAdmin.school_id
    })
      .select('_id name description category')
      .sort({ category: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: complaintTypes,
      message: 'Lấy danh sách loại đơn thành công'
    });
  } catch (error) {
    console.error('Error getting complaint types:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách loại đơn',
      error: error.message
    });
  }
};

// POST /api/school-admin/complaint-types - Tạo loại đơn mới
const createComplaintType = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const schoolAdminId = req.user.id;
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');

    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên loại đơn'
      });
    }

    // Validate category - có thể là array hoặc string
    let categories = [];
    if (Array.isArray(category)) {
      categories = category.filter(c => ['teacher', 'parent'].includes(c));
    } else if (category && ['teacher', 'parent'].includes(category)) {
      categories = [category];
    }

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một loại người dùng (teacher hoặc parent)'
      });
    }

    // Kiểm tra xem đã có loại đơn với tên này chưa (không phân biệt category)
    const existingType = await ComplaintType.findOne({
      name: name.trim(),
      school_id: schoolAdmin.school_id
    });

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Loại đơn này đã tồn tại'
      });
    }

    // Tạo loại đơn mới
    const newComplaintType = await ComplaintType.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      category: categories,
      school_id: schoolAdmin.school_id
    });

    res.status(201).json({
      success: true,
      data: newComplaintType,
      message: 'Tạo loại đơn thành công'
    });
  } catch (error) {
    console.error('Error creating complaint type:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo loại đơn',
      error: error.message
    });
  }
};

// PUT /api/school-admin/complaint-types/:typeId - Cập nhật loại đơn
const updateComplaintType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name, description, category } = req.body;
    const schoolAdminId = req.user.id;
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');

    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaintType = await ComplaintType.findById(typeId);
    if (!complaintType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại đơn'
      });
    }

    if (complaintType.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa loại đơn này'
      });
    }

    // Validation
    if (name && name.trim()) {
      // Kiểm tra xem đã có loại đơn khác với tên này chưa
      const existingType = await ComplaintType.findOne({
        name: name.trim(),
        _id: { $ne: typeId },
        school_id: schoolAdmin.school_id
      });

      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Loại đơn này đã tồn tại'
        });
      }

      complaintType.name = name.trim();
    }

    if (description !== undefined) {
      complaintType.description = description ? description.trim() : '';
    }

    // Validate và cập nhật category
    if (category !== undefined) {
      let categories = [];
      if (Array.isArray(category)) {
        categories = category.filter(c => ['teacher', 'parent'].includes(c));
      } else if (category && ['teacher', 'parent'].includes(category)) {
        categories = [category];
      }

      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một loại người dùng (teacher hoặc parent)'
        });
      }

      complaintType.category = categories;
    }

    await complaintType.save();

    res.json({
      success: true,
      data: complaintType,
      message: 'Cập nhật loại đơn thành công'
    });
  } catch (error) {
    console.error('Error updating complaint type:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật loại đơn',
      error: error.message
    });
  }
};

// DELETE /api/school-admin/complaint-types/:typeId - Xóa loại đơn
const deleteComplaintType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const schoolAdminId = req.user.id;
    const schoolAdmin = await User.findById(schoolAdminId).select('school_id');

    if (!schoolAdmin || !schoolAdmin.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaintType = await ComplaintType.findById(typeId);
    if (!complaintType) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy loại đơn'
      });
    }

    if (complaintType.school_id?.toString() !== schoolAdmin.school_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa loại đơn này'
      });
    }

    await ComplaintType.findByIdAndDelete(typeId);

    res.json({
      success: true,
      message: 'Xóa loại đơn thành công'
    });
  } catch (error) {
    console.error('Error deleting complaint type:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa loại đơn',
      error: error.message
    });
  }
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  approveComplaint,
  rejectComplaint,
  getComplaintStats,
  getAllComplaintTypes,
  createComplaintType,
  updateComplaintType,
  deleteComplaintType
};

