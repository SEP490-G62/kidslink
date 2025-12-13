const { Complaint, ComplaintType, User } = require('../../models');
const cloudinary = require('../../utils/cloudinary');

// GET /api/teachers/complaints/types - Lấy danh sách các loại đơn (chỉ loại teacher)
const getComplaintTypes = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('school_id');

    if (!user || !user.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaintTypes = await ComplaintType.find({
      category: { $in: ['teacher'] },
      school_id: user.school_id
    })
      .select('_id name description category')
      .sort({ createdAt: 1 });

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

// POST /api/teachers/complaints - Tạo đơn khiếu nại/góp ý mới
const createComplaint = async (req, res) => {
  try {
    const { complaint_type_id, reason, image } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('school_id');
    if (!user || !user.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    // Validation
    if (!complaint_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn loại đơn'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do hoặc nội dung'
      });
    }

    // Kiểm tra complaint_type_id có tồn tại và thuộc category 'teacher' không
    const complaintType = await ComplaintType.findTeacherTypeById(complaint_type_id, user.school_id);
    if (!complaintType) {
      return res.status(404).json({
        success: false,
        message: 'Loại đơn không tồn tại hoặc không dành cho giáo viên'
      });
    }
    const complaintTypeName = complaintType.name ? complaintType.name.trim() : '';

    // Upload ảnh lên Cloudinary nếu có
    let imageUrl = null;
    if (image) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'complaints',
          resource_type: 'image',
        });
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Có lỗi xảy ra khi upload ảnh',
          error: uploadError.message
        });
      }
    }

    // Tạo complaint mới
    const newComplaint = await Complaint.create({
      complaint_type_id,
      school_id: user.school_id,
      complaintTypeName: complaintTypeName || complaintType.name,
      reason: reason.trim(),
      image: imageUrl,
      status: 'pending',
      user_id: userId
    });

    // Lấy complaint với thông tin đầy đủ
    const complaintWithDetails = await Complaint.findById(newComplaint._id)
      .select('-complaint_type_id')
      .populate('user_id', 'full_name username avatar_url');

    res.status(201).json({
      success: true,
      data: complaintWithDetails,
      message: 'Gửi đơn thành công'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi đơn',
      error: error.message
    });
  }
};

// GET /api/teachers/complaints - Lấy danh sách đơn của teacher
const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('school_id');

    if (!user || !user.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaints = await Complaint.find({
      user_id: userId,
      school_id: user.school_id
    })
      .select('-complaint_type_id')
      .sort({ createdAt: -1 });

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

// GET /api/teachers/complaints/:complaintId - Lấy chi tiết một đơn
const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId).select('school_id');

    if (!user || !user.school_id) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    const complaint = await Complaint.findById(complaintId)
      .select('-complaint_type_id')
      .populate('user_id', 'full_name username avatar_url');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn'
      });
    }

    // Kiểm tra xem user có phải chủ sở hữu của đơn không
    if (complaint.user_id._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn này'
      });
    }

    if (complaint.school_id?.toString() !== user.school_id.toString()) {
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

module.exports = {
  getComplaintTypes,
  createComplaint,
  getMyComplaints,
  getComplaintById
};

