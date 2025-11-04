const mongoose = require('mongoose');
const { Class, Teacher, StudentClass, Student, DailyReport, User } = require('../models');

// --- Helper để lấy teacher từ request (có thể bỏ qua tạm khi test) ---
async function getTeacherByReqUser(req) {
  // Tạm thời hardcode một teacher ID để test
  // return await Teacher.findOne({ user_id: "671000000000000000000001" });

  // Nếu muốn dùng thực tế, cần authenticate middleware gán req.user
  const userId = req?.user?.id;
  if (!userId) return null;
  return await Teacher.findOne({ user_id: userId });
}

// --- Lấy tất cả teacher ---
async function getAllTeachers(req, res) {
  try {
    // Lấy từ bảng Teacher và populate user_id
    const teachers = await Teacher.find()
      .populate('user_id', '_id full_name email phone_number status')
      .lean();
    
    // Filter out inactive users
    const activeTeachers = teachers.filter(t => t.user_id && t.user_id.status === 1);
    
    return res.json({ count: activeTeachers.length, teachers: activeTeachers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}

// --- Lấy class của teacher ---
async function getTeacherClasses(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
    }

    const classes = await Class.find({
      $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
    })
      .populate('school_id')
      .populate('class_age_id')
      .sort({ academic_year: -1, class_name: 1 });

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

// --- Lấy students của class ---
async function getClassStudents(req, res) {
  try {
    let { class_id: classId } = req.query;
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) return res.status(404).json({ error: 'Không tìm thấy giáo viên' });

    let cls;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      const latest = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id')
        .sort({ academic_year: -1 })
        .limit(1);
      cls = Array.isArray(latest) ? latest[0] : latest;
      if (!cls) return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      classId = cls._id.toString();
    } else {
      cls = await Class.findOne({
        _id: classId,
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id');
      if (!cls) return res.status(403).json({ error: 'Không có quyền truy cập lớp này' });
    }

    const mappings = await StudentClass.find({ class_id: classId }).populate('student_id');
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

// --- Lấy attendance của students theo date ---
async function getStudentsAttendanceByDate(req, res) {
  try {
    let { class_id: classId } = req.query;
    const { date } = req.params;
    if (!date) return res.status(400).json({ error: 'Thiếu ngày cần tra cứu' });

    const teacher = await getTeacherByReqUser(req);
    if (!teacher) return res.status(404).json({ error: 'Không tìm thấy giáo viên' });

    let cls;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      const latest = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id')
        .sort({ academic_year: -1 })
        .limit(1);
      cls = Array.isArray(latest) ? latest[0] : latest;
      if (!cls) return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      classId = cls._id.toString();
    } else {
      cls = await Class.findOne({
        _id: classId,
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .populate('school_id')
        .populate('class_age_id');
      if (!cls) return res.status(403).json({ error: 'Không có quyền truy cập lớp này' });
    }

    const mappings = await StudentClass.find({ class_id: classId });
    const studentIds = mappings.map((m) => m.student_id);

    const start = new Date(date);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ error: 'Ngày không hợp lệ' });
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const reports = await DailyReport.find({
      student_id: { $in: studentIds },
      report_date: { $gte: start, $lte: end }
    })
      .populate('student_id')
      .populate('teacher_checkin_id')
      .populate('teacher_checkout_id');

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
        report: r || null
      };
    });

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
  getAllTeachers,
  getTeacherClasses,
  getTeacherClass: getTeacherClasses,
  getClassStudents,
  getStudentsAttendanceByDate
};
