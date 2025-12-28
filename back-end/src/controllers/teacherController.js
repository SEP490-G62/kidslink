const mongoose = require('mongoose');
const { Class, Teacher, StudentClass, Student, DailyReport, Calendar, User } = require('../models');
const cloudinary = require('../utils/cloudinary');

const getDateRange = (dateInput) => {
  const start = new Date(dateInput);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

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

    const teacherUser = await User.findById(teacher.user_id).select('school_id');
    const schoolId = teacherUser?.school_id || null;

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
      .sort((a, b) => {
        // Sort theo năm học: parse 4 ký tự đầu (năm bắt đầu) để so sánh số
        // academic_year có dạng "xxxx-xxxx" (ví dụ: "2023-2024", "2024-2025")
        const yearA = parseInt(a.substring(0, 4)) || 0;
        const yearB = parseInt(b.substring(0, 4)) || 0;
        return yearB - yearA; // Sort giảm dần để lấy năm học mới nhất trước
      })
      .map((year) => ({ academic_year: year, classes: grouped[year] }));

    let latestAcademicYear = null;
    let hasLatestAcademicYearClass = false;
    if (schoolId) {
      const academicYears = await Class.distinct('academic_year', { school_id: schoolId });
      if (Array.isArray(academicYears) && academicYears.length > 0) {
        // Sort theo năm học: parse 4 ký tự đầu (năm bắt đầu) để so sánh số
        academicYears.sort((a, b) => {
          const yearA = parseInt(a.substring(0, 4)) || 0;
          const yearB = parseInt(b.substring(0, 4)) || 0;
          return yearB - yearA; // Sort giảm dần để lấy năm học mới nhất
        });
        latestAcademicYear = academicYears[0];
        if (latestAcademicYear) {
          const match = await Class.exists({
            school_id: schoolId,
            academic_year: latestAcademicYear,
            $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
          });
          hasLatestAcademicYearClass = !!match;
        }
      }
    }

    return res.json({
      teacher_id: teacher._id,
      data: result,
      metadata: {
        latest_academic_year: latestAcademicYear,
        has_latest_academic_year_class: hasLatestAcademicYearClass,
        school_id: schoolId ? schoolId.toString() : null
      }
    });
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
      // Tìm năm học mới nhất từ các lớp của teacher
      const teacherClasses = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      }).select('academic_year');
      
      let latestAcademicYear = null;
      if (teacherClasses && teacherClasses.length > 0) {
        const academicYears = [...new Set(teacherClasses.map(c => c.academic_year))];
        if (academicYears.length > 0) {
          // Sort theo năm học: parse 4 ký tự đầu (năm bắt đầu) để so sánh số
          // academic_year có dạng "xxxx-xxxx" (ví dụ: "2023-2024", "2024-2025")
          academicYears.sort((a, b) => {
            const yearA = parseInt(a.substring(0, 4)) || 0;
            const yearB = parseInt(b.substring(0, 4)) || 0;
            return yearB - yearA; // Sort giảm dần để lấy năm học mới nhất
          });
          latestAcademicYear = academicYears[0];
        }
      }

      // Lấy lớp của teacher trong năm học mới nhất
      if (latestAcademicYear) {
        const latest = await Class.findOne({
          $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }],
          academic_year: latestAcademicYear
        })
          .populate('school_id')
          .populate('class_age_id')
          .sort({ class_name: 1 });
        cls = latest;
      } else {
        // Nếu không có lớp nào, trả về lỗi
        return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      }

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
      // Tìm năm học mới nhất từ các lớp của teacher
      const teacherClasses = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      }).select('academic_year');
      
      let latestAcademicYear = null;
      if (teacherClasses && teacherClasses.length > 0) {
        const academicYears = [...new Set(teacherClasses.map(c => c.academic_year))];
        if (academicYears.length > 0) {
          // Sort theo năm học: parse 4 ký tự đầu (năm bắt đầu) để so sánh số
          // academic_year có dạng "xxxx-xxxx" (ví dụ: "2023-2024", "2024-2025")
          academicYears.sort((a, b) => {
            const yearA = parseInt(a.substring(0, 4)) || 0;
            const yearB = parseInt(b.substring(0, 4)) || 0;
            return yearB - yearA; // Sort giảm dần để lấy năm học mới nhất
          });
          latestAcademicYear = academicYears[0];
        }
      }

      // Lấy lớp của teacher trong năm học mới nhất
      if (latestAcademicYear) {
        const latest = await Class.findOne({
          $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }],
          academic_year: latestAcademicYear
        })
          .populate('school_id')
          .populate('class_age_id')
          .sort({ class_name: 1 });
        cls = latest;
      } else {
        // Nếu không có lớp nào, trả về lỗi
        return res.status(404).json({ error: 'Giáo viên chưa có lớp học' });
      }

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

    const range = getDateRange(date);
    if (!range) return res.status(400).json({ error: 'Ngày không hợp lệ' });

    const hasSchedule = await Calendar.exists({
      class_id: classId,
      date: { $gte: range.start, $lte: range.end }
    });

    const reports = await DailyReport.find({
      student_id: { $in: studentIds },
      report_date: { $gte: range.start, $lte: range.end }
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
          has_checkin: !!(r && r.checkin_time), // Chỉ có checkin khi có checkin_time
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

    return res.json({ 
      class_id: classId, 
      date: range.start.toISOString().split('T')[0], 
      class_info, 
      statistics, 
      students,
      has_schedule: !!hasSchedule
    });
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

// GET /teacher/class-calendar
// Lấy lịch học của lớp có academic_year lớn nhất thuộc giáo viên hiện tại
async function getTeacherLatestClassCalendar(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    // Lấy lớp mới nhất theo academic_year mà giáo viên phụ trách
    const latestClass = await Class.findOne({
      $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
    })
      .sort({ academic_year: -1 })
      .populate({ path: 'teacher_id', model: Teacher, populate: { path: 'user_id', model: 'User' } });

    if (!latestClass) {
      return res.json({
        class: null,
        calendars: []
      });
    }

    // Lấy calendars của lớp và populate dữ liệu liên quan
    const calendars = await Calendar.find({ class_id: latestClass._id })
      .populate('weekday_id')
      .populate('slot_id')
      .populate('activity_id')
      .populate({ path: 'teacher_id', model: 'Teacher', populate: { path: 'user_id', model: 'User' } });

    const result = {
      class: {
        id: latestClass._id,
        name: latestClass.class_name,
        academicYear: latestClass.academic_year,
        teacher: latestClass.teacher_id && latestClass.teacher_id.user_id ? {
          id: latestClass.teacher_id._id,
          fullName: latestClass.teacher_id.user_id.full_name || latestClass.teacher_id.full_name || 'Giáo viên chủ nhiệm'
        } : null
      },
      calendars: calendars
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(c => ({
          id: c._id,
          date: c.date,
          weekday: c.weekday_id ? c.weekday_id.day_of_week : null,
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
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

module.exports.getTeacherLatestClassCalendar = getTeacherLatestClassCalendar;

// GET /teacher/teaching-calendar
// Lấy lịch dạy của giáo viên (tất cả các lớp mà giáo viên dạy)
async function getTeacherTeachingCalendar(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    // Lấy tất cả calendars mà giáo viên dạy (theo teacher_id trong calendar)
    const calendars = await Calendar.find({ teacher_id: teacher._id })
      .populate('weekday_id')
      .populate('slot_id')
      .populate('activity_id')
      .populate({ path: 'class_id', model: Class, select: 'class_name academic_year' })
      .populate({ path: 'teacher_id', model: Teacher, populate: { path: 'user_id', model: 'User' } });

    // Nếu giáo viên chưa có lịch dạy nào, trả về rỗng
    if (!calendars || calendars.length === 0) {
      // Tuy nhiên vẫn trả về các lớp giáo viên phụ trách (nếu có) để UI hiển thị danh sách
      const classes = await Class.find({
        $or: [{ teacher_id: teacher._id }, { teacher_id2: teacher._id }]
      })
        .sort({ academic_year: -1 })
        .select('class_name academic_year');

      return res.json({
        classes: classes.map(cls => ({
          id: cls._id,
          name: cls.class_name,
          academicYear: cls.academic_year
        })),
        calendars: []
      });
    }

    // Tạo map để nhóm theo lớp (bao gồm cả các lớp không phải GVCN nhưng giáo viên có tiết dạy)
    const classesMap = new Map();
    calendars.forEach(cal => {
      if (cal.class_id) {
        classesMap.set(cal.class_id._id.toString(), {
          id: cal.class_id._id,
          name: cal.class_id.class_name,
          academicYear: cal.class_id.academic_year
        });
      }
    });

    // Nhóm calendars theo ngày và lớp
    const calendarsByDate = new Map();
    calendars.forEach(cal => {
      const dateStr = new Date(cal.date).toISOString().split('T')[0];
      if (!calendarsByDate.has(dateStr)) {
        calendarsByDate.set(dateStr, []);
      }
      calendarsByDate.get(dateStr).push(cal);
    });

    // Format kết quả
    const result = {
      classes: Array.from(classesMap.values()),
      calendars: Array.from(calendarsByDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateStr, cals]) => ({
          date: dateStr,
          slots: cals.map(c => ({
            id: c._id,
            classId: c.class_id?._id,
            className: c.class_id?.class_name || 'Lớp không xác định',
            slotName: c.slot_id?.slot_name || '',
            startTime: c.slot_id?.start_time || '',
            endTime: c.slot_id?.end_time || '',
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
          }))
        }))
    };

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

module.exports.getTeacherTeachingCalendar = getTeacherTeachingCalendar;

// GET /teacher/profile
async function getMyProfile(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    const populated = await Teacher.findById(teacher._id).populate({ path: 'user_id', model: User });
    if (!populated) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ giáo viên' });
    }

    const user = populated.user_id;
    return res.json({
      teacher: {
        _id: populated._id,
        qualification: populated.qualification,
        major: populated.major,
        experience_years: populated.experience_years,
        note: populated.note
      },
      user: user ? {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status
      } : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

// PUT /teacher/profile
async function updateMyProfile(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    const {
      qualification,
      major,
      experience_years,
      note,
      full_name,
      email,
      phone_number,
      avatar_url
    } = req.body || {};

    // Build updates with allowlist
    const teacherUpdates = {};
    if (typeof qualification === 'string') teacherUpdates.qualification = qualification.trim();
    if (typeof major === 'string') teacherUpdates.major = major.trim();
    if (typeof experience_years !== 'undefined') {
      const years = Number(experience_years);
      if (!Number.isFinite(years) || years < 0) {
        return res.status(400).json({ error: 'experience_years không hợp lệ' });
      }
      teacherUpdates.experience_years = years;
    }
    if (typeof note === 'string') teacherUpdates.note = note.trim();

    const userUpdates = {};
    if (typeof full_name === 'string' && full_name.trim()) userUpdates.full_name = full_name.trim();
    if (typeof email === 'string') userUpdates.email = email.trim();
    if (typeof phone_number === 'string') userUpdates.phone_number = phone_number.trim();
    if (typeof avatar_url === 'string') userUpdates.avatar_url = avatar_url.trim();

    // Update teacher
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacher._id,
      { $set: teacherUpdates },
      { new: true }
    );

    // Update linked user if any fields provided
    let updatedUser = null;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await User.findByIdAndUpdate(teacher.user_id, { $set: userUpdates }, { new: true });
    } else {
      updatedUser = await User.findById(teacher.user_id);
    }

    return res.json({
      message: 'Cập nhật hồ sơ thành công',
      teacher: {
        _id: updatedTeacher._id,
        qualification: updatedTeacher.qualification,
        major: updatedTeacher.major,
        experience_years: updatedTeacher.experience_years,
        note: updatedTeacher.note
      },
      user: updatedUser ? {
        _id: updatedUser._id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        avatar_url: updatedUser.avatar_url,
        role: updatedUser.role,
        status: updatedUser.status
      } : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

module.exports.getMyProfile = getMyProfile;
module.exports.updateMyProfile = updateMyProfile;

// POST /teacher/profile/avatar
// Body: { image: <data_url or http url> }
async function uploadMyAvatar(req, res) {
  try {
    const teacher = await getTeacherByReqUser(req);
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy giáo viên cho người dùng hiện tại' });
    }

    const { image } = req.body || {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Thiếu ảnh tải lên' });
    }

    // Upload to Cloudinary (supports data URLs or remote URLs)
    const publicIdBase = `kidslink/avatars/user_${teacher.user_id}_${Date.now()}`;
    const uploadResult = await cloudinary.uploader.upload(image, {
      public_id: publicIdBase,
      folder: 'kidslink/avatars',
      overwrite: true,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    });

    // Persist to user profile
    const updatedUser = await User.findByIdAndUpdate(
      teacher.user_id,
      { $set: { avatar_url: uploadResult.secure_url } },
      { new: true }
    );

    return res.json({
      message: 'Tải ảnh thành công',
      avatar_url: uploadResult.secure_url,
      user: updatedUser ? {
        _id: updatedUser._id,
        full_name: updatedUser.full_name,
        avatar_url: updatedUser.avatar_url
      } : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
}

module.exports.uploadMyAvatar = uploadMyAvatar;


