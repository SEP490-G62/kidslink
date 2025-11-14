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
        slotName: `Tiết ${index + 1}`,
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
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giờ bắt đầu và giờ kết thúc'
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

    // Auto-generate slot name based on time order
    const allSlots = await Slot.find().sort({ start_time: 1 }).lean();
    let slotNumber = 1;
    for (const s of allSlots) {
      if (startTime > s.start_time) {
        slotNumber++;
      }
    }
    const slotName = `Tiết ${slotNumber}`;

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
        slotName: slotName,
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
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giờ bắt đầu và giờ kết thúc'
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

    // Update the slot
    await Slot.findByIdAndUpdate(
      slotId,
      {
        start_time: startTime,
        end_time: endTime
      }
    );

    // Regenerate all slot names based on new time order
    const allSlots = await Slot.find().sort({ start_time: 1 });
    for (let i = 0; i < allSlots.length; i++) {
      allSlots[i].slot_name = `Tiết ${i + 1}`;
      await allSlots[i].save();
    }

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
