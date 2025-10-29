const mongoose = require('mongoose');
const {
  Parent,
  ParentStudent,
  StudentClass,
  Class: ClassModel,
  Calendar,
  Slot,
  Activity,
  Teacher,
  WeekDay
} = require('../../models');

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
    const studentClasses = await StudentClass.find({ student_id: targetStudentId }).populate('class_id');
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

    // Lấy tất cả calendar của lớp đó và join dữ liệu liên quan
    const calendars = await Calendar.find({ class_id: latestClass._id })
      .populate('weekday_id');

    const calendarIds = calendars.map(c => c._id);

    // Lấy slots theo calendar
    const slots = await Slot.find({ calendar_id: { $in: calendarIds } })
      .populate('activity_id')
      .populate('teacher_id');

    // Group slots theo calendar_id
    const calendarIdToSlots = new Map();
    for (const slot of slots) {
      const key = slot.calendar_id.toString();
      if (!calendarIdToSlots.has(key)) calendarIdToSlots.set(key, []);
      calendarIdToSlots.get(key).push({
        id: slot._id,
        slotName: slot.slot_name,
        startTime: slot.start_time,
        endTime: slot.end_time,
        activity: slot.activity_id ? {
          id: slot.activity_id._id,
          name: slot.activity_id.activity_name || slot.activity_id.name || 'Hoạt động',
          description: slot.activity_id.description,
          require_outdoor: typeof slot.activity_id.require_outdoor === 'number' ? slot.activity_id.require_outdoor : 0
        } : null,
        teacher: slot.teacher_id ? {
          id: slot.teacher_id._id,
          fullName: slot.teacher_id.full_name
        } : null
      });
    }

    const result = {
      class: {
        id: latestClass._id,
        name: latestClass.class_name,
        academicYear: latestClass.academic_year
      },
      calendars: calendars
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(c => ({
          id: c._id,
          date: c.date,
          weekday: c.weekday_id ? c.weekday_id.day_of_week : null,
          slots: calendarIdToSlots.get(c._id.toString()) || []
        }))
    };

    return res.json(result);
  } catch (error) {
    console.error('getClassCalendarLatest Error:', error);
    return res.status(500).json({ error: 'Lỗi lấy lịch học lớp mới nhất' });
  }
}

module.exports = { getClassCalendarLatest };


