const Calendar = require('../models/Calendar');
const Slot = require('../models/Slot');
const Activity = require('../models/Activity');
const Class = require('../models/Class');
const WeekDay = require('../models/WeekDay');
const Teacher = require('../models/Teacher');
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

// GET all calendars for a class with slots
const getClassCalendars = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if class exists
    const classData = await Class.findById(classId)
      .populate({
        path: 'teacher_id',
        populate: {
          path: 'user_id',
          select: 'full_name avatar_url'
        }
      });
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Validate class belongs to same school (for school_admin)
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(classData.school_id) !== String(schoolId)) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem lịch học của lớp thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học'
        });
      }
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
      .populate({
        path: 'teacher_id',
        populate: {
          path: 'user_id',
          select: 'full_name avatar_url'
        }
      })
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
      const teacherUser = cal.teacher_id && cal.teacher_id.user_id ? cal.teacher_id.user_id : null;

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
        teacher: teacherUser ? {
          _id: cal.teacher_id._id,
          fullName: teacherUser.full_name,
          avatarUrl: teacherUser.avatar_url
        } : null
      });
    });

    const calendarsWithSlots = Object.values(groupedByDate);

    // Lấy danh sách các khung giờ tiết học chuẩn (Slot) - filter theo school_id nếu là school_admin
    let slotQuery = {};
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        slotQuery.school_id = schoolId;
      } catch (error) {
        // Nếu không lấy được school_id, vẫn tiếp tục nhưng không filter
        console.warn('Could not get school_id for admin:', error.message);
      }
    }
    const allSlots = await Slot.find(slotQuery).sort({ start_time: 1 });
    const timeSlots = allSlots.map((slot) => ({
      id: slot._id,
      slotName: slot.slot_name,
      startTime: slot.start_time,
      endTime: slot.end_time
    }));

    // Lấy thông tin giáo viên chủ nhiệm lớp (nếu có)
    const classTeacherUser = classData.teacher_id && classData.teacher_id.user_id
      ? classData.teacher_id.user_id
      : null;

    return res.json({
      success: true,
      data: {
        class: {
          _id: classData._id,
          name: classData.class_name,
          academicYear: classData.academic_year,
          teacher: classTeacherUser ? {
            fullName: classTeacherUser.full_name,
            avatarUrl: classTeacherUser.avatar_url
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
    console.log('Class found:', classData.class_name);

    // Validate class belongs to same school (for school_admin)
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(classData.school_id) !== String(schoolId)) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền quản lý lịch học của lớp thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học'
        });
      }
    }

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

    // Validate slot belongs to same school (for school_admin)
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(slot.school_id) !== String(schoolId)) {
          return res.status(403).json({
            success: false,
            message: 'Khung giờ tiết học không thuộc trường của bạn'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học'
        });
      }
    }

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

    // Validate activity belongs to same school (for school_admin)
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        if (String(activity.school_id) !== String(schoolId)) {
          return res.status(403).json({
            success: false,
            message: 'Hoạt động không thuộc trường của bạn'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học'
        });
      }
    }

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

    // Nếu đang tạo mới nhưng đã có lịch cùng class + date + slotId, thì chuyển sang chế độ update entry đó
    let targetCalendarId = calendarId;
    if ((!targetCalendarId || targetCalendarId === 'new') && existingCalendars.length > 0) {
      const sameSlotExisting = existingCalendars.find(cal => {
        return cal.slot_id && cal.slot_id._id.toString() === String(slotId);
      });
      if (sameSlotExisting) {
        targetCalendarId = String(sameSlotExisting._id);
      }
    }

    const conflicting = existingCalendars.find(cal => {
      // Exclude current calendar when updating
      if (targetCalendarId && targetCalendarId !== 'new' && cal._id.toString() === String(targetCalendarId)) return false;
      if (!cal.slot_id) return false;
      // Check time overlap
      return slot.start_time < cal.slot_id.end_time && slot.end_time > cal.slot_id.start_time;
    });

    if (conflicting) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ tiết học này bị trùng với một tiết học khác trong ngày của lớp'
      });
    }

    // Check for teacher overlapping calendar entries (teacher không được dạy 2 lớp cùng khung giờ)
    const teacherCalendars = await Calendar.find({
      teacher_id: finalTeacherId,
      date: { $gte: dateStart, $lt: dateEnd }
    })
      .populate('slot_id', 'start_time end_time')
      .populate('class_id', 'class_name')
      .lean();

    const teacherConflicting = teacherCalendars.find(cal => {
      // Exclude current calendar when updating
      if (targetCalendarId && targetCalendarId !== 'new' && cal._id.toString() === String(targetCalendarId)) return false;
      if (!cal.slot_id) return false;
      // Check time overlap
      return slot.start_time < cal.slot_id.end_time && slot.end_time > cal.slot_id.start_time;
    });

    if (teacherConflicting) {
      return res.status(400).json({
        success: false,
        message: `Giáo viên này đã có tiết học khác trong khoảng thời gian này (lớp ${teacherConflicting.class_id?.class_name || ''}). Vui lòng chọn giáo viên khác hoặc khung giờ khác.`
      });
    }

    let calendar;
    if (targetCalendarId && targetCalendarId !== 'new') {
      // Update existing calendar entry
      calendar = await Calendar.findByIdAndUpdate(
        targetCalendarId,
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

    const isUpdate = targetCalendarId && targetCalendarId !== 'new';

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Đã cập nhật lịch học' : 'Đã thêm lịch học mới',
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

// Helper function to parse academic year and get start year
function parseAcademicYear(academicYear) {
  if (!academicYear || typeof academicYear !== 'string') return -Infinity;
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10);
  return Number.isFinite(startYear) ? startYear : -Infinity;
}

// Helper function to get latest academic year for a school
async function getLatestAcademicYearForSchool(schoolId) {
  const academicYears = await Class.find({ school_id: schoolId }).distinct('academic_year');
  if (!academicYears || academicYears.length === 0) return null;
  
  // Sort by start year (parse academic year to get start year)
  academicYears.sort((a, b) => {
    const yearA = parseAcademicYear(a);
    const yearB = parseAcademicYear(b);
    return yearB - yearA; // Descending order
  });
  
  return academicYears[0];
}

// BULK create or update calendar entries
// Body: { entries: [{ classId, date, slotId, activityId, teacherId, delete }] }
const bulkUpsertCalendars = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách entries không hợp lệ',
      });
    }

    const classCache = new Map();
    const slotCache = new Map();
    const activityCache = new Map();
    const weekdayCache = new Map();
    const existingCalendarsCache = new Map(); // key: `${classId}_${dateStr}` -> calendars[]

    // Get school_id for school_admin
    let adminSchoolId = null;
    let latestAcademicYear = null;
    if (req.user?.role === 'school_admin') {
      try {
        adminSchoolId = await getSchoolIdForAdmin(req.user.id);
        // Lấy năm học lớn nhất của trường
        latestAcademicYear = await getLatestAcademicYearForSchool(adminSchoolId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học',
        });
      }
    }

    let successCount = 0;
    const errors = [];
    let filteredCount = 0; // Đếm số entry bị lọc bỏ

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const { classId, date, slotId, activityId, teacherId, delete: isDelete } = entry;

      if (!classId || !date || !slotId || (!activityId && !isDelete)) {
        errors.push({
          index: i,
          message: 'Thiếu dữ liệu bắt buộc (classId, date, slotId, activityId) hoặc cờ delete',
        });
        continue;
      }

      try {
        // Lấy class
        let classData = classCache.get(classId);
        if (!classData) {
          classData = await Class.findById(classId).populate('teacher_id');
          if (!classData) throw new Error('Không tìm thấy lớp học');
          classCache.set(classId, classData);
        }

        // Validate class belongs to same school (for school_admin)
        if (adminSchoolId && String(classData.school_id) !== String(adminSchoolId)) {
          throw new Error('Lớp học không thuộc trường của bạn');
        }

        // Chỉ xếp lịch cho các lớp thuộc năm học lớn nhất
        if (adminSchoolId && latestAcademicYear) {
          const classAcademicYear = classData.academic_year;
          if (classAcademicYear !== latestAcademicYear) {
            filteredCount++;
            continue; // Bỏ qua entry này, không xử lý
          }
        }

        // Lấy calendars của class + date
        const dateStart = new Date(new Date(date).setHours(0, 0, 0, 0));
        const dateEnd = new Date(new Date(date).setHours(23, 59, 59, 999));
        const cacheKey = `${classId}_${dateStart.toISOString().split('T')[0]}`;

        let existingCalendars = existingCalendarsCache.get(cacheKey);
        if (!existingCalendars) {
          existingCalendars = await Calendar.find({
            class_id: classId,
            date: { $gte: dateStart, $lt: dateEnd },
          })
            .populate('slot_id', 'start_time end_time')
            .lean();
          existingCalendarsCache.set(cacheKey, existingCalendars);
        }

        // Tìm entry cùng slot
        let targetCalendarId = null;
        const sameSlotExisting = existingCalendars.find(
          (cal) => cal.slot_id && cal.slot_id._id.toString() === String(slotId)
        );
        if (sameSlotExisting) {
          targetCalendarId = String(sameSlotExisting._id);
        }

        // Nếu là entry delete: xóa lịch nếu tồn tại, không validate teacher/overlap
        if (isDelete) {
          if (sameSlotExisting) {
            await Calendar.findByIdAndDelete(sameSlotExisting._id);
            // refresh cache sau khi xóa
            const updatedCalendars = await Calendar.find({
              class_id: classId,
              date: { $gte: dateStart, $lt: dateEnd },
            })
              .populate('slot_id', 'start_time end_time')
              .lean();
            existingCalendarsCache.set(cacheKey, updatedCalendars);
          }
          successCount++;
          continue;
        }

        // Lấy slot
        let slot = slotCache.get(slotId);
        if (!slot) {
          slot = await Slot.findById(slotId);
          if (!slot) throw new Error('Không tìm thấy khung giờ tiết học');
          slotCache.set(slotId, slot);
        }

        // Validate slot belongs to same school (for school_admin)
        if (adminSchoolId && String(slot.school_id) !== String(adminSchoolId)) {
          throw new Error('Khung giờ tiết học không thuộc trường của bạn');
        }

        // Lấy activity
        let activity = activityCache.get(activityId);
        if (!activity) {
          activity = await Activity.findById(activityId);
          if (!activity) throw new Error('Không tìm thấy hoạt động');
          activityCache.set(activityId, activity);
        }

        // Validate activity belongs to same school (for school_admin)
        if (adminSchoolId && String(activity.school_id) !== String(adminSchoolId)) {
          throw new Error('Hoạt động không thuộc trường của bạn');
        }

        // WeekDay
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dayOfWeek];

        let weekDay = weekdayCache.get(dayName);
        if (!weekDay) {
          weekDay = await WeekDay.findOne({ day_of_week: dayName });
          if (!weekDay) throw new Error('Không tìm thấy thông tin ngày trong tuần');
          weekdayCache.set(dayName, weekDay);
        }

        // Teacher
        const finalTeacherId = teacherId || (classData.teacher_id ? classData.teacher_id._id : null);
        if (!finalTeacherId) throw new Error('Lớp học chưa có giáo viên chủ nhiệm');

        // Check trùng giờ trong lớp (bỏ qua current khi update)
        const conflicting = existingCalendars.find((cal) => {
          if (targetCalendarId && cal._id.toString() === targetCalendarId) return false;
          if (!cal.slot_id) return false;
          return slot.start_time < cal.slot_id.end_time && slot.end_time > cal.slot_id.start_time;
        });
        if (conflicting) {
          throw new Error('Khung giờ tiết học này bị trùng với một tiết học khác trong ngày của lớp');
        }

        // Check trùng giờ theo giáo viên
        const teacherCalendars = await Calendar.find({
          teacher_id: finalTeacherId,
          date: { $gte: dateStart, $lt: dateEnd },
        })
          .populate('slot_id', 'start_time end_time')
          .lean();

        const teacherConflicting = teacherCalendars.find((cal) => {
          if (targetCalendarId && cal._id.toString() === targetCalendarId) return false;
          if (!cal.slot_id) return false;
          return slot.start_time < cal.slot_id.end_time && slot.end_time > cal.slot_id.start_time;
        });
        if (teacherConflicting) {
          throw new Error('Giáo viên này đã có tiết học khác trong khoảng thời gian này. Vui lòng chọn giáo viên khác hoặc khung giờ khác.');
        }

        // Tạo hoặc cập nhật
        if (targetCalendarId) {
          await Calendar.findByIdAndUpdate(
            targetCalendarId,
            {
              class_id: classId,
              weekday_id: weekDay._id,
              date: new Date(date),
              slot_id: slotId,
              activity_id: activityId,
              teacher_id: finalTeacherId,
            },
            { new: true }
          );
        } else {
          await Calendar.create({
            class_id: classId,
            weekday_id: weekDay._id,
            date: new Date(date),
            slot_id: slotId,
            activity_id: activityId,
            teacher_id: finalTeacherId,
          });
        }

        // refresh cache cho ngày đó
        const updatedCalendars = await Calendar.find({
          class_id: classId,
          date: { $gte: dateStart, $lt: dateEnd },
        })
          .populate('slot_id', 'start_time end_time')
          .lean();
        existingCalendarsCache.set(cacheKey, updatedCalendars);

        successCount++;
      } catch (err) {
        console.error('bulkUpsertCalendars entry error:', err);
        errors.push({ index: i, message: err.message || 'Lỗi không xác định' });
      }
    }

    const message = errors.length === 0
      ? filteredCount > 0
        ? `Đã áp dụng lịch mặc định thành công. Đã bỏ qua ${filteredCount} entry không thuộc năm học lớn nhất.`
        : 'Đã áp dụng lịch mặc định thành công'
      : 'Hoàn thành với một số lỗi';

    return res.json({
      success: errors.length === 0,
      message,
      data: {
        total: entries.length,
        successCount,
        errorCount: errors.length,
        filteredCount, // Số entry bị lọc bỏ (không thuộc năm học lớn nhất)
        errors,
      },
    });
  } catch (error) {
    console.error('bulkUpsertCalendars error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi áp dụng lịch mặc định hàng loạt',
      error: error.message,
    });
  }
};

// DELETE calendar entry (xóa 1 tiết học cụ thể trong ngày)
const deleteCalendarEntry = async (req, res) => {
  try {
    const { calendarId } = req.params;

    const calendar = await Calendar.findById(calendarId).populate('class_id', 'school_id');
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học'
      });
    }

    // Validate class belongs to same school (for school_admin)
    if (req.user?.role === 'school_admin') {
      try {
        const schoolId = await getSchoolIdForAdmin(req.user.id);
        const classData = await Class.findById(calendar.class_id).select('school_id');
        if (!classData || String(classData.school_id) !== String(schoolId)) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xóa lịch học của lớp thuộc trường khác'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'School admin chưa được gán trường học'
        });
      }
    }

    // Không cho phép xóa lịch của ngày đã qua
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calendarDate = new Date(calendar.date);
    calendarDate.setHours(0, 0, 0, 0);
    if (calendarDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa lịch của ngày đã qua'
      });
    }

    await Calendar.findByIdAndDelete(calendarId);

    return res.json({
      success: true,
      message: 'Đã xóa tiết học khỏi lịch'
    });
  } catch (error) {
    console.error('deleteCalendarEntry error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa lịch học',
      error: error.message
    });
  }
};

// GET all activities
const getAllActivities = async (req, res) => {
  try {
    // Filter by school_id if user is school_admin
    let query = {};
    if (req.user?.role === 'school_admin') {
      const schoolId = await getSchoolIdForAdmin(req.user.id);
      query.school_id = schoolId;
    }

    const activities = await Activity.find(query).sort({ activity_name: 1 });

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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách hoạt động',
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

    // Get school_id for school_admin
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền tạo activity'
      });
    }

    const activity = await Activity.create({
      activity_name: name,
      description: description,
      require_outdoor: requireOutdoor || 0,
      school_id: schoolId
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo hoạt động',
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

    // Get school_id for school_admin and validate ownership
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền sửa activity'
      });
    }

    // Check if activity exists and belongs to the same school
    const existingActivity = await Activity.findById(activityId);
    if (!existingActivity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }

    if (String(existingActivity.school_id) !== String(schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa activity của trường khác'
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật hoạt động',
      error: error.message
    });
  }
};

// DELETE activity
const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    // Get school_id for school_admin and validate ownership
    let schoolId = null;
    if (req.user?.role === 'school_admin') {
      schoolId = await getSchoolIdForAdmin(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Chỉ school_admin mới có quyền xóa activity'
      });
    }

    // Check if activity exists and belongs to the same school
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động'
      });
    }

    if (String(activity.school_id) !== String(schoolId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa activity của trường khác'
      });
    }

    // Check if activity is being used in any calendar entries
    const calendarsCount = await Calendar.countDocuments({ activity_id: activityId });
    if (calendarsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa hoạt động này vì đang được sử dụng trong ${calendarsCount} tiết học`
      });
    }

    await Activity.findByIdAndDelete(activityId);

    return res.json({
      success: true,
      message: 'Đã xóa hoạt động'
    });
  } catch (error) {
    console.error('deleteActivity error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa hoạt động',
      error: error.message
    });
  }
};

// GET all teachers
const getAllTeachers = async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const User = require('../models/User');

    // Helper function để lấy school_id từ school_admin
    const getSchoolIdForAdmin = async (userId) => {
      const admin = await User.findById(userId).select('school_id');
      if (!admin || !admin.school_id) {
        const error = new Error('School admin chưa được gán trường học');
        error.statusCode = 400;
        throw error;
      }
      return admin.school_id;
    };

    let schoolIdFilter = null;
    
    // Nếu là school_admin, chỉ lấy teachers có cùng school_id
    if (req.user?.role === 'school_admin') {
      try {
        schoolIdFilter = await getSchoolIdForAdmin(req.user.id);
      } catch (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message
        });
      }
    }

    // Tìm tất cả users có role teacher và cùng school_id (nếu có filter)
    const userFilter = { role: 'teacher' };
    if (schoolIdFilter) {
      userFilter.school_id = schoolIdFilter;
    }

    const users = await User.find(userFilter).select('_id full_name email avatar_url school_id');
    const userIds = users.map(u => u._id);

    // Tìm teachers có user_id trong danh sách users
    const teachers = await Teacher.find({ user_id: { $in: userIds } })
      .populate('user_id', 'full_name email avatar_url school_id')
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
  bulkUpsertCalendars,
  deleteCalendarEntry,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllTeachers,
  updateAllSlotNames
};