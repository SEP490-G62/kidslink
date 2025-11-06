const Calendar = require('../models/Calendar');
const Slot = require('../models/Slot');
const Activity = require('../models/Activity');
const Class = require('../models/Class');
const WeekDay = require('../models/WeekDay');
const Teacher = require('../models/Teacher');

// GET all calendars for a class with slots
const getClassCalendars = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if class exists
    const classData = await Class.findById(classId)
      .populate('teacher_id', 'full_name avatar_url');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Build query for calendars
    const query = { class_id: classId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get calendars with populated data
    const calendars = await Calendar.find(query)
      .populate('weekday_id', 'day_name')
      .sort({ date: 1 });

    // Get slots for each calendar
    const calendarsWithSlots = await Promise.all(
      calendars.map(async (calendar) => {
        const slots = await Slot.find({ calendar_id: calendar._id })
          .populate('activity_id', 'activity_name description require_outdoor')
          .populate('teacher_id', 'full_name avatar_url')
          .sort({ start_time: 1 });

        return {
          _id: calendar._id,
          date: calendar.date,
          weekday: calendar.weekday_id,
          slots: slots.map(slot => ({
            id: slot._id,
            slotName: slot.slot_name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            activity: slot.activity_id ? {
              _id: slot.activity_id._id,
              name: slot.activity_id.activity_name,
              description: slot.activity_id.description,
              require_outdoor: slot.activity_id.require_outdoor
            } : null,
            teacher: slot.teacher_id ? {
              _id: slot.teacher_id._id,
              fullName: slot.teacher_id.full_name,
              avatarUrl: slot.teacher_id.avatar_url
            } : null
          }))
        };
      })
    );

    // Lấy danh sách các khung giờ tiết học duy nhất từ TẤT CẢ các slots (áp dụng chung cho tất cả lớp)
    const allSlots = await Slot.find().sort({ start_time: 1 });

    const uniqueTimeSlots = new Map();
    allSlots.forEach(slot => {
      const key = `${slot.start_time}_${slot.end_time}`;
      if (!uniqueTimeSlots.has(key)) {
        uniqueTimeSlots.set(key, {
          startTime: slot.start_time,
          endTime: slot.end_time
        });
      }
    });

    // Chuyển thành mảng và sắp xếp theo thời gian, sau đó đặt tên "Tiết 1", "Tiết 2"...
    const timeSlots = Array.from(uniqueTimeSlots.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((slot, index) => ({
        slotName: `Tiết ${index + 1}`,
        slotNumber: index + 1,
        startTime: slot.startTime,
        endTime: slot.endTime
      }));

    return res.json({
      success: true,
      data: {
        class: {
          _id: classData._id,
          name: classData.class_name,
          academicYear: classData.academic_year,
          teacher: classData.teacher_id ? {
            fullName: classData.teacher_id.full_name,
            avatarUrl: classData.teacher_id.avatar_url
          } : null
        },
        timeSlots: timeSlots,
        calendars: calendarsWithSlots
      }
    });
  } catch (error) {
    console.error('getClassCalendars error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch học',
      error: error.message
    });
  }
};

// CREATE or UPDATE slot (nội dung môn học cho một ngày cụ thể)
const createOrUpdateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { 
      classId,
      date,
      startTime,
      endTime,
      activityId
    } = req.body;

    // Validate required fields - chỉ cần thời gian
    if (!classId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp thông tin lớp học, ngày và thời gian'
      });
    }

    // Tính tên tiết học dựa trên thứ tự thời gian (tất cả các lớp dùng chung)
    const allUniqueSlots = await Slot.find().sort({ start_time: 1 });
    const uniqueTimeSlotsMap = new Map();
    allUniqueSlots.forEach(slot => {
      const key = `${slot.start_time}_${slot.end_time}`;
      if (!uniqueTimeSlotsMap.has(key)) {
        uniqueTimeSlotsMap.set(key, {
          startTime: slot.start_time,
          endTime: slot.end_time
        });
      }
    });

    // Kiểm tra xem khung giờ này đã tồn tại chưa
    const currentKey = `${startTime}_${endTime}`;
    if (!uniqueTimeSlotsMap.has(currentKey)) {
      uniqueTimeSlotsMap.set(currentKey, {
        startTime: startTime,
        endTime: endTime
      });
    }

    // Sắp xếp và tính số thứ tự
    const sortedSlots = Array.from(uniqueTimeSlotsMap.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const slotIndex = sortedSlots.findIndex(s => s.startTime === startTime && s.endTime === endTime);
    const generatedSlotName = `Tiết ${slotIndex + 1}`;

    // Check if class exists and get teacher
    const classData = await Class.findById(classId).populate('teacher_id');
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Check if activity exists (nếu có)
    if (activityId) {
      const activity = await Activity.findById(activityId);
      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hoạt động'
        });
      }
    }

    // Get weekday from date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Get WeekDay document
    const weekDay = await WeekDay.findOne({ day_of_week: dayOfWeek });
    if (!weekDay) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin ngày trong tuần'
      });
    }

    // Find or create calendar for this date
    let calendar = await Calendar.findOne({
      class_id: classId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
      }
    });

    if (!calendar) {
      calendar = await Calendar.create({
        class_id: classId,
        weekday_id: weekDay._id,
        date: new Date(date)
      });
    }

    let slot;
    if (slotId && slotId !== 'new') {
      // Update existing slot
      const updateData = {
        slot_name: generatedSlotName,
        start_time: startTime,
        end_time: endTime,
        calendar_id: calendar._id
      };
      
      // Chỉ update activity nếu có
      if (activityId) {
        updateData.activity_id = activityId;
      }
      
      // Update teacher nếu class có teacher
      if (classData.teacher_id) {
        updateData.teacher_id = classData.teacher_id._id;
      }
      
      slot = await Slot.findByIdAndUpdate(slotId, updateData, { new: true })
        .populate('activity_id', 'activity_name description require_outdoor')
        .populate('teacher_id', 'full_name avatar_url');

      if (!slot) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tiết học'
        });
      }
    } else {
      // Create new slot
      const newSlotData = {
        slot_name: generatedSlotName,
        start_time: startTime,
        end_time: endTime,
        calendar_id: calendar._id
      };
      
      // Chỉ thêm activity nếu có
      if (activityId) {
        newSlotData.activity_id = activityId;
      }
      
      // Thêm teacher nếu class có teacher
      if (classData.teacher_id) {
        newSlotData.teacher_id = classData.teacher_id._id;
      }
      
      slot = await Slot.create(newSlotData);

      slot = await Slot.findById(slot._id)
        .populate('activity_id', 'activity_name description require_outdoor')
        .populate('teacher_id', 'full_name avatar_url');
    }

    return res.status(slotId && slotId !== 'new' ? 200 : 201).json({
      success: true,
      message: slotId && slotId !== 'new' ? 'Đã cập nhật tiết học' : 'Đã tạo tiết học mới',
      data: {
        id: slot._id,
        slotName: slot.slot_name,
        startTime: slot.start_time,
        endTime: slot.end_time,
        activity: slot.activity_id ? {
          _id: slot.activity_id._id,
          name: slot.activity_id.activity_name,
          description: slot.activity_id.description,
          require_outdoor: slot.activity_id.require_outdoor
        } : null,
        teacher: slot.teacher_id ? {
          _id: slot.teacher_id._id,
          fullName: slot.teacher_id.full_name,
          avatarUrl: slot.teacher_id.avatar_url
        } : null
      }
    });
  } catch (error) {
    console.error('createOrUpdateSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu tiết học',
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
        message: 'Không tìm thấy tiết học'
      });
    }

    await Slot.findByIdAndDelete(slotId);

    // Check if calendar has no more slots, delete calendar
    const remainingSlots = await Slot.countDocuments({ calendar_id: slot.calendar_id });
    if (remainingSlots === 0) {
      await Calendar.findByIdAndDelete(slot.calendar_id);
    }

    return res.json({
      success: true,
      message: 'Đã xóa tiết học'
    });
  } catch (error) {
    console.error('deleteSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tiết học',
      error: error.message
    });
  }
};

// GET all activities
const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ activity_name: 1 });

    return res.json({
      success: true,
      data: activities.map(activity => ({
        _id: activity._id,
        name: activity.activity_name,
        description: activity.description,
        requireOutdoor: activity.require_outdoor
      }))
    });
  } catch (error) {
    console.error('getAllActivities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hoạt động',
      error: error.message
    });
  }
};

// CREATE activity
const createActivity = async (req, res) => {
  try {
    const { name, description, requireOutdoor } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và mô tả hoạt động'
      });
    }

    const activity = await Activity.create({
      activity_name: name,
      description: description,
      require_outdoor: requireOutdoor || 0
    });

    return res.status(201).json({
      success: true,
      message: 'Đã tạo hoạt động mới',
      data: {
        _id: activity._id,
        name: activity.activity_name,
        description: activity.description,
        requireOutdoor: activity.require_outdoor
      }
    });
  } catch (error) {
    console.error('createActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hoạt động',
      error: error.message
    });
  }
};

// UPDATE activity
const updateActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { name, description, requireOutdoor } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và mô tả hoạt động'
      });
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        activity_name: name,
        description: description,
        require_outdoor: requireOutdoor || 0
      },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật hoạt động',
      data: {
        _id: activity._id,
        name: activity.activity_name,
        description: activity.description,
        requireOutdoor: activity.require_outdoor
      }
    });
  } catch (error) {
    console.error('updateActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hoạt động',
      error: error.message
    });
  }
};

// DELETE activity
const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    // Check if activity is being used in any slots
    const slotsCount = await Slot.countDocuments({ activity_id: activityId });
    if (slotsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa hoạt động này vì đang được sử dụng trong ${slotsCount} tiết học`
      });
    }

    const activity = await Activity.findByIdAndDelete(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa hoạt động'
    });
  } catch (error) {
    console.error('deleteActivity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hoạt động',
      error: error.message
    });
  }
};

// GET all teachers
const getAllTeachers = async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const User = require('../models/User');

    const teachers = await Teacher.find()
      .populate('user_id', 'full_name avatar_url')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: teachers.map(teacher => ({
        _id: teacher._id,
        fullName: teacher.user_id?.full_name || 'Chưa xác định',
        avatarUrl: teacher.user_id?.avatar_url || '',
        specialization: teacher.specialization || ''
      }))
    });
  } catch (error) {
    console.error('getAllTeachers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giáo viên',
      error: error.message
    });
  }
};

// Update all slot names based on time order (Migration function)
const updateAllSlotNames = async (req, res) => {
  try {
    // Lấy tất cả slots và sắp xếp theo thời gian
    const allSlots = await Slot.find().sort({ start_time: 1 });
    
    // Tạo map các khung giờ duy nhất
    const uniqueTimeSlotsMap = new Map();
    allSlots.forEach(slot => {
      const key = `${slot.start_time}_${slot.end_time}`;
      if (!uniqueTimeSlotsMap.has(key)) {
        uniqueTimeSlotsMap.set(key, {
          startTime: slot.start_time,
          endTime: slot.end_time
        });
      }
    });

    // Sắp xếp và tạo mapping tên tiết học
    const sortedSlots = Array.from(uniqueTimeSlotsMap.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const slotNameMapping = new Map();
    sortedSlots.forEach((slot, index) => {
      const key = `${slot.startTime}_${slot.endTime}`;
      slotNameMapping.set(key, `Tiết ${index + 1}`);
    });

    // Cập nhật tất cả slots
    let updatedCount = 0;
    for (const slot of allSlots) {
      const key = `${slot.start_time}_${slot.end_time}`;
      const newName = slotNameMapping.get(key);
      if (newName && slot.slot_name !== newName) {
        await Slot.findByIdAndUpdate(slot._id, { slot_name: newName });
        updatedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Đã cập nhật ${updatedCount} tiết học`,
      data: {
        totalSlots: allSlots.length,
        updatedSlots: updatedCount,
        uniqueTimeSlots: sortedSlots.length
      }
    });
  } catch (error) {
    console.error('updateAllSlotNames error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tên tiết học',
      error: error.message
    });
  }
};

module.exports = {
  getClassCalendars,
  createOrUpdateSlot,
  deleteSlot,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllTeachers,
  updateAllSlotNames
};
