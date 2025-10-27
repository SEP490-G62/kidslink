const Class = require('../models/Class');
const StudentClass = require('../models/StudentClass');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ClassAge = require('../models/ClassAge');
const School = require('../models/School');
const DailyReport = require('../models/DailyReport');

// Lấy thông tin lớp học của teacher hiện tại
async function getTeacherClass(req, res) {
  try {
    const user_id = req.user.id; // Lấy từ middleware auth

    // Tìm teacher từ user_id
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }

    // Lấy năm học hiện tại (có thể cần logic phức tạp hơn)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Nếu từ tháng 9 trở đi thì là năm học mới, ngược lại là năm học cũ
    let academicYear;
    if (currentMonth >= 9) {
      academicYear = `${currentYear}-${currentYear + 1}`;
    } else {
      academicYear = `${currentYear - 1}-${currentYear}`;
    }

    // Tìm lớp học của teacher trong năm học hiện tại
    const teacherClass = await Class.findOne({
      teacher_id: teacher._id,
      academic_year: academicYear
    })
    .populate('class_age_id', 'age age_name')
    .populate('school_id', 'school_name address')
    .populate('teacher_id2', 'user_id')
    .populate({
      path: 'teacher_id2',
      populate: {
        path: 'user_id',
        select: 'full_name username'
      }
    });

    if (!teacherClass) {
      return res.status(404).json({ 
        error: 'Không tìm thấy lớp học trong năm học hiện tại',
        academic_year: academicYear
      });
    }

    // Lấy danh sách học sinh trong lớp
    const studentClasses = await StudentClass.find({ class_id: teacherClass._id })
      .populate('student_id', 'full_name dob gender avatar_url status allergy');

    // Đếm số học sinh (chỉ tính những học sinh có thông tin hợp lệ)
    const validStudentClasses = studentClasses.filter(sc => sc.student_id);
    const studentCount = validStudentClasses.length;

    // Tính tuổi trung bình của học sinh
    const today = new Date();
    let totalAge = 0;
    let validStudents = 0;

    validStudentClasses.forEach(sc => {
      if (sc.student_id && sc.student_id.dob) {
        const age = today.getFullYear() - new Date(sc.student_id.dob).getFullYear();
        totalAge += age;
        validStudents++;
      }
    });

    const averageAge = validStudents > 0 ? Math.round(totalAge / validStudents) : 0;

    // Chuẩn bị dữ liệu trả về
    const classData = {
      class_info: {
        _id: teacherClass._id,
        class_name: teacherClass.class_name,
        academic_year: teacherClass.academic_year,
        class_age: teacherClass.class_age_id,
        school: teacherClass.school_id,
        main_teacher: {
          _id: teacher._id,
          user_id: teacher.user_id
        },
        assistant_teacher: teacherClass.teacher_id2
      },
      statistics: {
        total_students: studentCount,
        average_age: averageAge,
        class_age_range: teacherClass.class_age_id ? teacherClass.class_age_id.age_name : 'N/A'
      },
      students: validStudentClasses.map(sc => ({
          _id: sc.student_id._id,
          full_name: sc.student_id.full_name,
          dob: sc.student_id.dob,
          gender: sc.student_id.gender,
          avatar_url: sc.student_id.avatar_url,
          status: sc.student_id.status,
          allergy: sc.student_id.allergy,
          discount: sc.discount
        }))
    };

    return res.json({
      message: 'Lấy thông tin lớp học thành công',
      data: classData
    });

  } catch (err) {
    console.error('Error in getTeacherClass:', err);
    return res.status(500).json({ 
      error: 'Không thể lấy thông tin lớp học', 
      message: err.message 
    });
  }
}

// Lấy danh sách học sinh trong lớp (có phân trang)
async function getClassStudents(req, res) {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Tìm teacher từ user_id
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }

    // Lấy năm học hiện tại
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Nếu từ tháng 9 trở đi thì là năm học mới, ngược lại là năm học cũ
    let academicYear;
    if (currentMonth >= 9) {
      academicYear = `${currentYear}-${currentYear + 1}`;
    } else {
      academicYear = `${currentYear - 1}-${currentYear}`;
    }

    // Tìm lớp học của teacher
    const teacherClass = await Class.findOne({
      teacher_id: teacher._id,
      academic_year: academicYear
    });

    if (!teacherClass) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    }

    const skip = (page - 1) * limit;

    // Lấy danh sách học sinh với phân trang
    const studentClasses = await StudentClass.find({ class_id: teacherClass._id })
      .populate('student_id', 'full_name dob gender avatar_url status allergy')
      .sort({ 'student_id.full_name': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudentClass.countDocuments({ class_id: teacherClass._id });

    const students = studentClasses
      .filter(sc => sc.student_id) // Lọc bỏ các record có student_id null
      .map(sc => ({
        _id: sc.student_id._id,
        full_name: sc.student_id.full_name,
        dob: sc.student_id.dob,
        gender: sc.student_id.gender,
        avatar_url: sc.student_id.avatar_url,
        status: sc.student_id.status,
        allergy: sc.student_id.allergy,
        discount: sc.discount
      }));

    return res.json({
      message: 'Lấy danh sách học sinh thành công',
      data: {
        students,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_records: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (err) {
    console.error('Error in getClassStudents:', err);
    return res.status(500).json({ 
      error: 'Không thể lấy danh sách học sinh', 
      message: err.message 
    });
  }
}

// Lấy danh sách học sinh với trạng thái checkin/checkout theo ngày
async function getStudentsAttendanceByDate(req, res) {
  try {
    const user_id = req.user.id;
    const { date } = req.params;
    
    // Validate date format yyyy-mm-dd
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        error: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng yyyy-mm-dd' 
      });
    }
    
    // Parse date và tạo date range cho ngày đó
    const reportDate = new Date(date + 'T00:00:00.000Z');
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({ error: 'Ngày không hợp lệ' });
    }
    
    // Tạo start và end của ngày để tìm kiếm chính xác
    const startOfDay = new Date(reportDate);
    const endOfDay = new Date(reportDate);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    // Tìm teacher từ user_id
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }

    // Lấy năm học hiện tại
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Nếu từ tháng 9 trở đi thì là năm học mới, ngược lại là năm học cũ
    let academicYear;
    if (currentMonth >= 9) {
      academicYear = `${currentYear}-${currentYear + 1}`;
    } else {
      academicYear = `${currentYear - 1}-${currentYear}`;
    }

    // Tìm lớp học của teacher
    const teacherClass = await Class.findOne({
      teacher_id: teacher._id,
      academic_year: academicYear
    });

    if (!teacherClass) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    }

    // Lấy danh sách học sinh trong lớp
    const studentClasses = await StudentClass.find({ class_id: teacherClass._id })
      .populate('student_id', 'full_name dob gender avatar_url status allergy')
      .sort({ 'student_id.full_name': 1 });

    // Lấy tất cả báo cáo trong ngày của các học sinh trong lớp
    const studentIds = studentClasses
      .filter(sc => sc.student_id)
      .map(sc => sc.student_id._id);

    const dailyReports = await DailyReport.find({
      student_id: { $in: studentIds },
      report_date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    .populate('student_id', 'full_name avatar_url')
    .populate('teacher_checkin_id', 'user_id')
    .populate('teacher_checkout_id', 'user_id');

    // Tạo map để tra cứu nhanh báo cáo theo student_id
    const reportMap = {};
    dailyReports.forEach(report => {
      reportMap[report.student_id._id.toString()] = report;
    });

    // Chuẩn bị dữ liệu trả về
    const studentsWithAttendance = studentClasses
      .filter(sc => sc.student_id) // Lọc bỏ các record có student_id null
      .map(sc => {
        const student = sc.student_id;
        const report = reportMap[student._id.toString()];
        
        return {
          _id: student._id,
          full_name: student.full_name,
          dob: student.dob,
          gender: student.gender,
          avatar_url: student.avatar_url,
          status: student.status,
          allergy: student.allergy,
          discount: sc.discount,
          attendance: {
            has_checkin: !!report,
            checkin_time: report ? report.checkin_time : null,
            has_checkout: !!(report && report.checkout_time),
            checkout_time: report ? report.checkout_time : null,
            teacher_checkin: report ? report.teacher_checkin_id : null,
            teacher_checkout: report ? report.teacher_checkout_id : null,
            comments: report ? report.comments : null,
            report_id: report ? report._id : null
          }
        };
      });

    // Thống kê
    const totalStudents = studentsWithAttendance.length;
    const checkedInStudents = studentsWithAttendance.filter(s => s.attendance.has_checkin).length;
    const checkedOutStudents = studentsWithAttendance.filter(s => s.attendance.has_checkout).length;
    const absentStudents = totalStudents - checkedInStudents;

    const statistics = {
      total_students: totalStudents,
      checked_in: checkedInStudents,
      checked_out: checkedOutStudents,
      absent: absentStudents,
      attendance_rate: totalStudents > 0 ? Math.round((checkedInStudents / totalStudents) * 100) : 0
    };

    return res.json({
      message: 'Lấy danh sách học sinh với trạng thái điểm danh thành công',
      data: {
        date: date,
        class_info: {
          _id: teacherClass._id,
          class_name: teacherClass.class_name,
          academic_year: teacherClass.academic_year
        },
        statistics: statistics,
        students: studentsWithAttendance
      }
    });

  } catch (err) {
    console.error('Error in getStudentsAttendanceByDate:', err);
    return res.status(500).json({ 
      error: 'Không thể lấy danh sách học sinh với trạng thái điểm danh', 
      message: err.message 
    });
  }
}

module.exports = {
  getTeacherClass,
  getClassStudents,
  getStudentsAttendanceByDate
};
