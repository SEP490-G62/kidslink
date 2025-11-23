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

    // Get calendars with populated data - theo model mới
    const calendars = await Calendar.find(query)
      .populate('weekday_id', 'day_name')
      .populate('slot_id', 'slot_name start_time end_time')
      .populate('activity_id', 'activity_name description require_outdoor')
      .populate('teacher_id', 'full_name avatar_url')
      .sort({ date: 1, 'slot_id.start_time': 1 });

    // Group by date
    const groupedByDate = {};
    calendars.forEach(cal => {
      const dateKey = cal.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          _id: dateKey,
          date: cal.date,
          weekday: cal.weekday_id,
          slots: []
        };
      }
      groupedByDate[dateKey].slots.push({
        id: cal._id, // Calendar entry ID
        slotId: cal.slot_id?._id,
        slotName: cal.slot_id?.slot_name || '',
        startTime: cal.slot_id?.start_time || '',
        endTime: cal.slot_id?.end_time || '',
        activity: cal.activity_id ? {
          _id: cal.activity_id._id,
          name: cal.activity_id.activity_name,
          description: cal.activity_id.description,
          require_outdoor: cal.activity_id.require_outdoor
        } : null,
        teacher: cal.teacher_id ? {
          _id: cal.teacher_id._id,
          fullName: cal.teacher_id.full_name,
          avatarUrl: cal.teacher_id.avatar_url
        } : null
      });
    });

    const calendarsWithSlots = Object.values(groupedByDate);

    // Lấy danh sách các khung giờ tiết học chuẩn (Slot)
    const allSlots = await Slot.find().sort({ start_time: 1 });
    const timeSlots = allSlots.map((slot, index) => ({
      id: slot._id,
      slotName: slot.slot_name,
      slotNumber: index + 1,
      startTime: slot.start_time,
      endTime: slot.end_time
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

// CREATE or UPDATE calendar entry (thêm nội dung activity cho 1 tiết học trong ngày cụ thể)
const createOrUpdateCalendarEntry = async (req, res) => {
  try {
    console.log('=== CREATE/UPDATE CALENDAR ENTRY ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    const { calendarId } = req.params; // Calendar entry ID (not slot!)
    const { 
      classId,
      date,
      slotId,      // ID của Slot (khung giờ chuẩn)
      activityId,  // Activity cho tiết học này
      teacherId    // Teacher (optional, default to class teacher)
    } = req.body;

    // Validate required fields
    if (!classId || !date || !slotId || !activityId) {
      console.log('Missing required fields:', { classId, date, slotId, activityId });
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: lớp học, ngày, tiết học và hoạt động'
      });
    }

    // Check if class exists and get default teacher
    const classData = await Class.findById(classId).populate('teacher_id');
    if (!classData) {
      console.log('Class not found:', classId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }
    console.log('Class found:', classData.name);

    // Verify slot exists
    const slot = await Slot.findById(slotId);
    if (!slot) {
      console.log('Slot not found:', slotId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khung giờ tiết học'
      });
    }
    console.log('Slot found:', slot.slot_name);

    // Verify activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      console.log('Activity not found:', activityId);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }
    console.log('Activity found:', activity.name);

    // Get weekday from date
    const dateObj = new Date(date);
    console.log('Date object:', dateObj, 'Day of week:', dateObj.getDay());
    const dayOfWeek = dateObj.getDay();
    
    // Convert day number to day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    console.log('Looking for weekday:', dayName);
    
    const weekDay = await WeekDay.findOne({ day_of_week: dayName });
    if (!weekDay) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin ngày trong tuần'
      });
    }

    // Determine teacher
    const finalTeacherId = teacherId || (classData.teacher_id ? classData.teacher_id._id : null);
    if (!finalTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'Lớp học chưa có giáo viên chủ nhiệm'
      });
    }

    // Check for overlapping calendar entries (same class, date, overlapping slot time)
    const dateStart = new Date(new Date(date).setHours(0, 0, 0, 0));
    const dateEnd = new Date(new Date(date).setHours(23, 59, 59, 999));
    
    const existingCalendars = await Calendar.find({
      class_id: classId,
      date: { $gte: dateStart, $lt: dateEnd }
    }).populate('slot_id', 'start_time end_time').lean();

    const conflicting = existingCalendars.find(cal => {
      // Exclude current calendar when updating
      if (calendarId && calendarId !== 'new' && cal._id.toString() === String(calendarId)) return false;
      if (!cal.slot_id) return false;
      // Check time overlap
      return slot.start_time < cal.slot_id.end_time && slot.end_time > cal.slot_id.start_time;
    });

    if (conflicting) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ tiết học này bị trùng với một tiết học khác trong ngày'
      });
    }

    let calendar;
    if (calendarId && calendarId !== 'new') {
      // Update existing calendar entry
      calendar = await Calendar.findByIdAndUpdate(
        calendarId,
        {
          class_id: classId,
          weekday_id: weekDay._id,
          date: new Date(date),
          slot_id: slotId,
          activity_id: activityId,
          teacher_id: finalTeacherId
        },
        { new: true }
      )
        .populate('slot_id', 'slot_name start_time end_time')
        .populate('activity_id', 'activity_name description require_outdoor')
        .populate('teacher_id', 'full_name avatar_url');

      if (!calendar) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch học'
        });
      }
    } else {
      // Create new calendar entry
      calendar = await Calendar.create({
        class_id: classId,
        weekday_id: weekDay._id,
        date: new Date(date),
        slot_id: slotId,
        activity_id: activityId,
        teacher_id: finalTeacherId
      });

      calendar = await Calendar.findById(calendar._id)
        .populate('slot_id', 'slot_name start_time end_time')
        .populate('activity_id', 'activity_name description require_outdoor')
        .populate('teacher_id', 'full_name avatar_url');
    }

    return res.status(calendarId && calendarId !== 'new' ? 200 : 201).json({
      success: true,
      message: calendarId && calendarId !== 'new' ? 'Đã cập nhật lịch học' : 'Đã thêm lịch học mới',
      data: {
        id: calendar._id,
        slotId: calendar.slot_id?._id,
        slotName: calendar.slot_id?.slot_name || '',
        startTime: calendar.slot_id?.start_time || '',
        endTime: calendar.slot_id?.end_time || '',
        activity: calendar.activity_id ? {
          _id: calendar.activity_id._id,
          name: calendar.activity_id.activity_name,
          description: calendar.activity_id.description,
          require_outdoor: calendar.activity_id.require_outdoor
        } : null,
        teacher: calendar.teacher_id ? {
          _id: calendar.teacher_id._id,
          fullName: calendar.teacher_id.full_name,
          avatarUrl: calendar.teacher_id.avatar_url
        } : null
      }
    });
  } catch (error) {
    console.error('createOrUpdateCalendarEntry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu lịch học',
      error: error.message
    });
  }
};

// DELETE calendar entry (xóa 1 tiết học cụ thể trong ngày)
const deleteCalendarEntry = async (req, res) => {
  try {
    const { calendarId } = req.params;

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học'
      });
    }

    await Calendar.findByIdAndDelete(calendarId);

    return res.json({
      success: true,
      message: 'Đã xóa tiết học khỏi lịch'
    });
  } catch (error) {
    console.error('deleteCalendarEntry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch học',
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

    // Check if activity is being used in any calendar entries
    const calendarsCount = await Calendar.countDocuments({ activity_id: activityId });
    if (calendarsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa hoạt động này vì đang được sử dụng trong ${calendarsCount} tiết học`
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
        user_id: teacher.user_id ? {
          _id: teacher.user_id._id,
          full_name: teacher.user_id.full_name || 'Chưa xác định',
          email: teacher.user_id.email,
          avatar_url: teacher.user_id.avatar_url || ''
        } : null,
        fullName: teacher.user_id?.full_name || 'Chưa xác định', // Giữ lại để tương thích
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
  createOrUpdateCalendarEntry,
  deleteCalendarEntry,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllTeachers,
  updateAllSlotNames
};
