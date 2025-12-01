const mongoose = require('mongoose');
const {
  Parent,
  ParentStudent,
  StudentClass,
  Class: ClassModel,
  Calendar,
  Slot,
  User
} = require('../../models');

// Helper: lấy school_id của user (parent/teacher/...) từ bảng User
async function getSchoolIdForUser(userId) {
  const user = await User.findById(userId).select('school_id');
  if (!user || !user.school_id) {
    const error = new Error('Tài khoản chưa được gán trường học');
    error.statusCode = 400;
    throw error;
  }
  return user.school_id;
}

// GET /parent/class-calendar?student_id=optional
// Trả về lịch học theo lớp của con với năm học mới nhất
async function getClassCalendarLatest(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }

    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ phụ huynh' });
    }

    const requestedStudentId = req.query.student_id;

    // Lấy danh sách con của phụ huynh
    const parentStudents = await ParentStudent.find({ parent_id: parent._id });
    if (parentStudents.length === 0) {
      return res.status(404).json({ error: 'Phụ huynh chưa có học sinh liên kết' });
    }

    const studentIds = parentStudents.map(ps => ps.student_id);
    let targetStudentId;

    if (requestedStudentId) {
      const isOwned = studentIds.some(id => id.toString() === requestedStudentId);
      if (!isOwned) {
        return res.status(403).json({ error: 'Học sinh không thuộc phụ huynh này' });
      }
      targetStudentId = requestedStudentId;
    } else {
      // Mặc định lấy học sinh đầu tiên
      targetStudentId = studentIds[0].toString();
    }

    // Lấy tất cả lớp mà học sinh đã/đang học
    const studentClasses = await StudentClass.find({ student_id: targetStudentId })
      .populate({
        path: 'class_id',
        populate: {
          path: 'teacher_id',
          model: 'Teacher',
          populate: {
            path: 'user_id',
            model: 'User'
          }
        }
      });
    if (studentClasses.length === 0) {
      return res.status(404).json({ error: 'Học sinh chưa được xếp lớp' });
    }

    // Chọn lớp có năm học mới nhất
    function parseAcademicYear(ay) {
      // định dạng kỳ vọng: "YYYY-YYYY"
      if (!ay || typeof ay !== 'string') return -Infinity;
      const parts = ay.split('-');
      const startYear = parseInt(parts[0], 10);
      return Number.isFinite(startYear) ? startYear : -Infinity;
    }

    const sortedByYearDesc = [...studentClasses].sort((a, b) => {
      const aYear = parseAcademicYear(a.class_id && a.class_id.academic_year);
      const bYear = parseAcademicYear(b.class_id && b.class_id.academic_year);
      return bYear - aYear;
    });

    const latestClass = sortedByYearDesc[0].class_id;

    // Lấy tất cả calendar của lớp đó và join dữ liệu liên quan (slot/activity/teacher)
    const calendars = await Calendar.find({ class_id: latestClass._id })
      .populate('weekday_id')
      .populate('slot_id')
      .populate('activity_id')
      .populate({
        path: 'teacher_id',
        model: 'Teacher',
        populate: {
          path: 'user_id',
          model: 'User'
        }
      });

    // Lấy teacher của class (teacher_id)
    const classTeacher = latestClass.teacher_id && latestClass.teacher_id.user_id 
      ? {
          id: latestClass.teacher_id._id,
          fullName: latestClass.teacher_id.user_id.full_name || latestClass.teacher_id.full_name || 'Giáo viên chủ nhiệm'
        }
      : null;

    const result = {
      class: {
        id: latestClass._id,
        name: latestClass.class_name,
        academicYear: latestClass.academic_year,
        teacher: classTeacher
      },
      calendars: calendars
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(c => ({
          id: c._id,
          date: c.date,
          weekday: c.weekday_id ? c.weekday_id.day_of_week : null,
          // Theo logic mới, mỗi calendar gắn trực tiếp 1 slot/activity/teacher
          slots: c.slot_id ? [{
            id: c.slot_id._id,
            slotName: c.slot_id.slot_name,
            startTime: c.slot_id.start_time,
            endTime: c.slot_id.end_time,
            activity: c.activity_id ? {
              id: c.activity_id._id,
              name: c.activity_id.activity_name || c.activity_id.name || 'Hoạt động',
              description: c.activity_id.description,
              require_outdoor: typeof c.activity_id.require_outdoor === 'number' ? c.activity_id.require_outdoor : 0
            } : null,
            teacher: c.teacher_id ? {
              id: c.teacher_id._id,
              fullName: c.teacher_id.user_id?.full_name || c.teacher_id.full_name || 'Giáo viên'
            } : null
          }] : []
        }))
    };

    return res.json(result);
  } catch (error) {
    console.error('getClassCalendarLatest Error:', error);
    return res.status(500).json({ error: 'Lỗi lấy lịch học lớp mới nhất' });
  }
}

module.exports = { getClassCalendarLatest };

// GET /parent/class-calendar/slots
// Trả về danh sách slot (khung giờ) chuẩn để render theo hàng
async function getClassTimeSlots(req, res) {
  try {
    // Lấy school_id của user hiện tại (parent hoặc teacher dùng chung API này)
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }

    let schoolId;
    try {
      schoolId = await getSchoolIdForUser(userId);
    } catch (error) {
      return res.status(error.statusCode || 400).json({ error: error.message });
    }

    const slots = await Slot.find({ school_id: schoolId }).sort({ start_time: 1, end_time: 1 });
    const data = slots.map(s => ({
      id: s._id,
      slotName: s.slot_name,
      startTime: s.start_time,
      endTime: s.end_time
    }));
    return res.json({ data });
  } catch (error) {
    console.error('getClassTimeSlots Error:', error);
    return res.status(500).json({ error: 'Lỗi lấy danh sách khung giờ' });
  }
}

module.exports.getClassTimeSlots = getClassTimeSlots;


