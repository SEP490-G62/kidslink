const Slot = require('../models/Slot');
const Calendar = require('../models/Calendar');
const User = require('../models/User');

// Helper function to get school_id for school_admin
async function getSchoolIdForAdmin(userId) {
  const admin = await User.findById(userId).select('school_id');
  if (!admin || !admin.school_id) {
    const error = new Error('School admin chưa được gán trường học');
    error.statusCode = 400;
    throw error;
  }
  return admin.school_id;
}

// GET all slots (khung giờ tiết học chuẩn)
const getAllSlots = async (req, res) => {
  try {
    // Filter by school_id if user is school_admin
    let query = {};
    if (req.user?.role === 'school_admin') {
      const schoolId = await getSchoolIdForAdmin(req.user.id);
      query.school_id = schoolId;
    }

    const slots = await Slot.find(query).sort({ start_time: 1 });

    return res.json({
      success: true,
      data: slots.map((slot) => ({
        _id: slot._id,
        slotName: slot.slot_name,
        startTime: slot.start_time,
        endTime: slot.end_time
      }))
    });
  } catch (error) {
    console.error('getAllSlots error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách khung giờ',
      error: error.message
    });
  }
};

// CREATE slot (tạo khung giờ tiết học mới)
const createSlot = async (req, res) => {
  try {
    const { slotName, startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giờ bắt đầu và giờ kết thúc'
      });
    }

    if (!slotName || slotName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên tiết học'
      });
    }

    // Get school_id for school_admin
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền tạo slot'
      });
    }

    // Validate time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Check for overlapping slots within the same school
    const slots = await Slot.find({ school_id: schoolId }).lean();
    const overlapping = slots.find(s => {
      return startTime < s.end_time && endTime > s.start_time;
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này bị trùng với một tiết học khác'
      });
    }

    const slot = await Slot.create({
      slot_name: slotName.trim(),
      start_time: startTime,
      end_time: endTime,
      school_id: schoolId
    });

    return res.status(201).json({
      success: true,
      message: 'Đã tạo khung giờ tiết học mới',
      data: {
        _id: slot._id,
        slotName: slot.slot_name,
        startTime: slot.start_time,
        endTime: slot.end_time
      }
    });
  } catch (error) {
    console.error('createSlot error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo khung giờ tiết học',
      error: error.message
    });
  }
};

// UPDATE slot
const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { slotName, startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giờ bắt đầu và giờ kết thúc'
      });
    }

    if (!slotName || slotName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên tiết học'
      });
    }

    // Get school_id for school_admin and validate ownership
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền sửa slot'
      });
    }

    // Check if slot exists and belongs to the same school
    const existingSlot = await Slot.findById(slotId);
    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    if (String(existingSlot.school_id) !== String(schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa slot của trường khác'
      });
    }

    // Validate time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Check for overlapping with other slots in the same school
    const slots = await Slot.find({ school_id: schoolId }).lean();
    const overlapping = slots.find(s => {
      if (s._id.toString() === slotId) return false; // exclude current
      return startTime < s.end_time && endTime > s.start_time;
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này bị trùng với một tiết học khác'
      });
    }

    // Update the slot (bao gồm cả slotName)
    await Slot.findByIdAndUpdate(
      slotId,
      {
        slot_name: slotName.trim(),
        start_time: startTime,
        end_time: endTime
      }
    );

    const updatedSlot = await Slot.findById(slotId);
    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật khung giờ tiết học',
      data: {
        _id: updatedSlot._id,
        slotName: updatedSlot.slot_name,
        startTime: updatedSlot.start_time,
        endTime: updatedSlot.end_time
      }
    });
  } catch (error) {
    console.error('updateSlot error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật khung giờ tiết học',
      error: error.message
    });
  }
};

// DELETE slot
const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    // Get school_id for school_admin and validate ownership
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền xóa slot'
      });
    }

    // Check if slot exists and belongs to the same school
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    if (String(slot.school_id) !== String(schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa slot của trường khác'
      });
    }

    // Check if slot is being used in any calendar
    const calendarsCount = await Calendar.countDocuments({ slot_id: slotId });
    if (calendarsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa khung giờ này vì đang được sử dụng trong ${calendarsCount} lịch học`
      });
    }

    await Slot.findByIdAndDelete(slotId);

    return res.json({
      success: true,
      message: 'Đã xóa khung giờ tiết học'
    });
  } catch (error) {
    console.error('deleteSlot error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa khung giờ tiết học',
      error: error.message
    });
  }
};

module.exports = {
  getAllSlots,
  createSlot,
  updateSlot,
  deleteSlot
};