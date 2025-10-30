const mongoose = require('mongoose');
const { Class, Teacher, StudentClass, Student, DailyReport } = require('../models');

// Helper to get teacher document from authenticated user
async function getTeacherByReqUser(req) {
  const userId = req?.user?.id;
  if (!userId) return null;
  return await Teacher.findOne({ user_id: userId });
}

// GET /teacher/class -> return all classes grouped by academic_year for the teacher
async function getTeacherClasses(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    const classes = await Class.find({
      $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
    })
      .populate('school_id')
      .populate('class_age_id')
      .sort({ academic_year: -1, class_name: 1 });

    // Group by academic_year
    const grouped = classes.reduce((acc, cls) => {
      const year = cls.academic_year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(cls);
      return acc;
    }, {});

    const result = Object.keys(grouped)
      .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
      .map((year) => ({ academic_year: year, classes: grouped[year] }));

    return res.json({ teacher_id: teacher._id, data: result });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

// Backward compatible alias if existing code imports singular name
async function getTeacherClass(req, res) {
  return getTeacherClasses(req, res);
}

// GET /teacher/class/students?class_id=...
async function getClassStudents(req, res) {
  try {
    let { class_id: classId } = req.query;
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    let cls;
    // Fallback to latest class if no class_id provided
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      const latest = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id')
        .sort({ academic_year: -1 })
        .limit(1);
      cls = Array.isArray(latest) ? latest[0] : latest;
      if (!cls) {
        return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      }
      classId = cls._id.toString();
    } else {
      // Ensure teacher owns this class
      cls = await Class.findOne({
        _id: classId,
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id');
      if (!cls) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
      }
    }

    const mappings = await StudentClass.find({ class_id: classId })
      .populate({ path: 'student_id', model: Student });

    const students = mappings
      .filter((m) => !!m.student_id)
      .map((m) => ({
        _id: m.student_id._id,
        full_name: m.student_id.full_name,
        avatar_url: m.student_id.avatar_url,
        dob: m.student_id.dob,
        gender: m.student_id.gender,
        status: m.student_id.status,
        allergy: m.student_id.allergy,
        discount: m.discount || 0
      }));

    const class_info = {
      _id: cls._id,
      class_name: cls.class_name,
      academic_year: cls.academic_year,
      class_age: cls.class_age_id || null,
      school: cls.school_id || null
    };

    return res.json({ class_id: classId, class_info, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

// GET /teacher/class/students/attendance/:date?class_id=...
async function getStudentsAttendanceByDate(req, res) {
  try {
    let { class_id: classId } = req.query;
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ error: 'Thiếu ngày cần tra cứu' });
    }

    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    let cls;
    // If classId missing or invalid, fallback to teacher's latest academic year class
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      cls = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id')
        .sort({ academic_year: -1 })
        .limit(1);
      cls = Array.isArray(cls) ? cls[0] : cls;
      if (!cls) {
        return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      }
      classId = cls._id.toString();
    } else {
      cls = await Class.findOne({
        _id: classId,
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id');
      if (!cls) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
      }
    }

    // Determine students in class
    const mappings = await StudentClass.find({ class_id: classId });
    const studentIds = mappings.map((m) => m.student_id);

    // Parse date boundaries
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Định dạng ngày không hợp lệ' });
    }
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const reports = await DailyReport.find({
      student_id: { $in: studentIds },
      report_date: { $gte: start, $lte: end }
    })
      .populate('student_id')
      .populate('teacher_checkin_id')
      .populate('teacher_checkout_id');

    // Build students list with attendance flags for UI compatibility
    const studentDocs = await Student.find({ _id: { $in: studentIds } });
    const studentIdToDiscount = mappings.reduce((acc, m) => {
      acc[m.student_id.toString()] = m.discount || 0;
      return acc;
    }, {});

    const reportMap = reports.reduce((acc, r) => {
      acc[r.student_id._id.toString()] = r;
      return acc;
    }, {});

    const students = studentDocs.map((s) => {
      const r = reportMap[s._id.toString()];
      return {
        _id: s._id,
        full_name: s.full_name,
        avatar_url: s.avatar_url,
        dob: s.dob,
        gender: s.gender,
        status: s.status,
        allergy: s.allergy,
        discount: studentIdToDiscount[s._id.toString()] || 0,
        attendance: {
          has_checkin: !!r,
          has_checkout: !!(r && r.checkout_time),
          checkin_time: r ? r.checkin_time : null,
          checkout_time: r ? r.checkout_time : null
        },
        report: r || null // Thêm trường này cho FE đọc report.comments
      };
    });

    // Statistics
    const totalStudents = students.length;
    const checkedIn = students.filter((s) => s.attendance.has_checkin).length;
    const checkedOut = students.filter((s) => s.attendance.has_checkout).length;
    const attendanceRate = totalStudents > 0 ? Math.round((checkedIn / totalStudents) * 100) : 0;

    const statistics = {
      total_students: totalStudents,
      checked_in: checkedIn,
      checked_out: checkedOut,
      attendance_rate: attendanceRate
    };

    const class_info = {
      _id: cls._id,
      class_name: cls.class_name,
      academic_year: cls.academic_year,
      class_age: cls.class_age_id || null,
      school: cls.school_id || null
    };

    return res.json({ class_id: classId, date: start.toISOString().split('T')[0], class_info, statistics, students });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

module.exports = {
  getTeacherClasses,
  getTeacherClass,
  getClassStudents,
  getStudentsAttendanceByDate
};


