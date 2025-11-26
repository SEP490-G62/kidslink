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

    // Cập nhật lại tên tất cả các slot theo thứ tự thời gian
    const allSlotsAfterInsert = await Slot.find().sort({ start_time: 1 });
    for (let i = 0; i < allSlotsAfterInsert.length; i++) {
      const newSlotName = `Tiết ${i + 1}`;
      if (allSlotsAfterInsert[i].slot_name !== newSlotName) {
        await Slot.findByIdAndUpdate(allSlotsAfterInsert[i]._id, {
          slot_name: newSlotName
        });
      }
    }

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

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }

    // Xóa tất cả calendar entries sử dụng slot này
    const deletedCalendars = await Calendar.deleteMany({ slot_id: slotId });
    console.log(`Deleted ${deletedCalendars.deletedCount} calendar entries associated with slot ${slotId}`);

    // Xóa slot
    await Slot.findByIdAndDelete(slotId);

    // Cập nhật lại tên tất cả các slot còn lại theo thứ tự thời gian
    const allSlots = await Slot.find().sort({ start_time: 1 });
    for (let i = 0; i < allSlots.length; i++) {
      const newSlotName = `Tiết ${i + 1}`;
      if (allSlots[i].slot_name !== newSlotName) {
        await Slot.findByIdAndUpdate(allSlots[i]._id, {
          slot_name: newSlotName
        });
      }
    }

    return res.json({
      success: true,
      message: deletedCalendars.deletedCount > 0 
        ? `Đã xóa khung giờ tiết học và ${deletedCalendars.deletedCount} nội dung tiết học liên quan`
        : 'Đã xóa khung giờ tiết học'
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
