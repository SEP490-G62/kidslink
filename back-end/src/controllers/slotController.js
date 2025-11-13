const Slot = require('../models/Slot');
const Calendar = require('../models/Calendar');

// GET all slots (khung giờ tiết học chuẩn)
const getAllSlots = async (req, res) => {
  try {
    const slots = await Slot.find().sort({ start_time: 1 });

    return res.json({
      success: true,
      data: slots.map((slot, index) => ({
        _id: slot._id,
        slotName: slot.slot_name,
        slotNumber: index + 1,
        startTime: slot.start_time,
        endTime: slot.end_time
      }))
    });
  } catch (error) {
    console.error('getAllSlots error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khung giờ',
      error: error.message
    });
  }
};

// CREATE slot (tạo khung giờ tiết học mới)
const createSlot = async (req, res) => {
  try {
    const { slotName, startTime, endTime } = req.body;

    if (!slotName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên tiết, giờ bắt đầu và giờ kết thúc'
      });
    }

    // Validate time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Check for overlapping slots
    const slots = await Slot.find().lean();
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
      slot_name: slotName,
      start_time: startTime,
      end_time: endTime
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
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo khung giờ tiết học',
      error: error.message
    });
  }
};

// UPDATE slot
const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { slotName, startTime, endTime } = req.body;

    if (!slotName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên tiết, giờ bắt đầu và giờ kết thúc'
      });
    }

    // Validate time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Check for overlapping with other slots
    const slots = await Slot.find().lean();
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

    const slot = await Slot.findByIdAndUpdate(
      slotId,
      {
        slot_name: slotName,
        start_time: startTime,
        end_time: endTime
      },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật khung giờ tiết học',
      data: {
        _id: slot._id,
        slotName: slot.slot_name,
        startTime: slot.start_time,
        endTime: slot.end_time
      }
    });
  } catch (error) {
    console.error('updateSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật khung giờ tiết học',
      error: error.message
    });
  }
};

// DELETE slot
const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    // Check if slot is being used in any calendar
    const calendarsCount = await Calendar.countDocuments({ slot_id: slotId });
    if (calendarsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa khung giờ này vì đang được sử dụng trong ${calendarsCount} lịch học`
      });
    }

    const slot = await Slot.findByIdAndDelete(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa khung giờ tiết học'
    });
  } catch (error) {
    console.error('deleteSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khung giờ tiết học',
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
