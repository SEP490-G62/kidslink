const DailyReport = require('../models/DailyReport');
const Student = require('../models/Student');
const StudentClass = require('../models/StudentClass');
const Calendar = require('../models/Calendar');
// Helper: tìm lớp mà giáo viên phụ trách đối với học sinh (ưu tiên lớp có academic_year lớn nhất)
const getTeacherClassForStudent = async (studentId, teacherId) => {
  const mappings = await StudentClass.find({ student_id: studentId }).populate('class_id');
  const validClasses = [];
  
  console.log('=== getTeacherClassForStudent DEBUG ===');
  console.log('Student ID:', studentId);
  console.log('Teacher ID:', teacherId);
  console.log('Total student-class mappings:', mappings.length);
  
  // Log tất cả các lớp mà học sinh thuộc về
  const allStudentClasses = mappings.map(m => ({
    class_id: m.class_id?._id,
    class_name: m.class_id?.class_name,
    academic_year: m.class_id?.academic_year,
    teacher_id: m.class_id?.teacher_id,
    teacher_id2: m.class_id?.teacher_id2
  }));
  console.log('All classes student belongs to:', allStudentClasses);
  
  for (const mapping of mappings) {
    const classDoc = mapping.class_id;
    if (!classDoc) continue;
    const isOwner = (classDoc.teacher_id && classDoc.teacher_id.equals(teacherId)) ||
      (classDoc.teacher_id2 && classDoc.teacher_id2.equals(teacherId));
    
    console.log(`Checking class ${classDoc.class_name} (${classDoc.academic_year}):`, {
      class_id: classDoc._id,
      teacher_id: classDoc.teacher_id,
      teacher_id2: classDoc.teacher_id2,
      isOwner: isOwner
    });
    
    if (isOwner) {
      validClasses.push(classDoc);
    }
  }
  
  console.log('Valid classes (teacher is owner):', validClasses.length);
  
  if (validClasses.length === 0) {
    console.log('No valid class found for student-teacher pair');
    return null;
  }
  
  // Sort theo academic_year (lớn nhất trước) và trả về lớp đầu tiên
  validClasses.sort((a, b) => {
    // Parse năm học đầu tiên từ academic_year (dạng "xxxx-xxxx")
    const yearA = parseInt(a.academic_year.substring(0, 4)) || 0;
    const yearB = parseInt(b.academic_year.substring(0, 4)) || 0;
    return yearB - yearA; // Sort giảm dần để lấy năm học mới nhất
  });
  
  const selectedClass = validClasses[0];
  console.log('Selected class (highest academic_year):', {
    class_id: selectedClass._id,
    class_name: selectedClass.class_name,
    academic_year: selectedClass.academic_year
  });
  console.log('=== END getTeacherClassForStudent DEBUG ===');
  
  return selectedClass;
};

const hasScheduleForClassDate = async (classId, dateInput) => {
  if (!classId || !dateInput) {
    console.log('hasScheduleForClassDate: Invalid input', { classId, dateInput });
    return false;
  }
  
  // Nếu dateInput là Date object, convert sang string format yyyy-mm-dd
  // Nếu là string, dùng trực tiếp
  let dateStr;
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else {
    dateStr = dateInput;
  }
  
  // Parse date string thành các phần year, month, day và tạo Date với local timezone
  // Để đảm bảo setHours hoạt động đúng với local time
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.log('hasScheduleForClassDate: Invalid date format', dateStr);
    return false;
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2], 10);
  
  // Tạo Date object với local timezone (không dùng UTC)
  const start = new Date(year, month, day, 0, 0, 0, 0);
  if (Number.isNaN(start.getTime())) {
    console.log('hasScheduleForClassDate: Invalid date', dateStr);
    return false;
  }
  
  const end = new Date(year, month, day, 23, 59, 59, 999);
  
  console.log('hasScheduleForClassDate: Checking calendar', {
    classId,
    dateStr,
    start: start.toISOString(),
    end: end.toISOString()
  });
  
  // Debug: Tìm tất cả calendar của class này để xem có gì
  const allCalendars = await Calendar.find({ class_id: classId }).limit(10);
  console.log('hasScheduleForClassDate: All calendars for class:', allCalendars.length);
  if (allCalendars.length > 0) {
    console.log('hasScheduleForClassDate: Sample calendar dates:', allCalendars.map(c => ({
      id: c._id,
      date: c.date,
      dateISO: c.date.toISOString(),
      class_id: c.class_id
    })));
  }
  
  // Debug: Tìm calendar trong date range
  const calendarsInRange = await Calendar.find({
    class_id: classId,
    date: { $gte: start, $lte: end }
  });
  console.log('hasScheduleForClassDate: Calendars in range:', calendarsInRange.length);
  if (calendarsInRange.length > 0) {
    console.log('hasScheduleForClassDate: Found calendars:', calendarsInRange.map(c => ({
      id: c._id,
      date: c.date.toISOString(),
      class_id: c.class_id
    })));
  }
  
  const exists = await Calendar.exists({
    class_id: classId,
    date: { $gte: start, $lte: end }
  });
  
  console.log('hasScheduleForClassDate: Result', exists);
  return !!exists;
};

// Helper function: Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
const getTodayVietnam = () => {
  const now = new Date();
  // getTime() trả về UTC timestamp, cộng thêm 7 giờ để có giờ Việt Nam
  const vietnamTime = now.getTime() + (7 * 60 * 60 * 1000);
  const vietnamDate = new Date(vietnamTime);
  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function: Chuyển Date sang ngày theo múi giờ Việt Nam (UTC+7)
const getDateVietnam = (date) => {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  // Lấy UTC time và cộng thêm 7 giờ để có giờ Việt Nam
  const utcTime = dateObj.getTime();
  const vietnamTime = utcTime + (7 * 60 * 60 * 1000);
  const vietnamDate = new Date(vietnamTime);
  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Validation chung cho checkin và checkout
const studentValidators = [
  (req, res, next) => {
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ error: 'student_id là bắt buộc' });
    }
    
    // Kiểm tra student_id có hợp lệ không
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    
    // Kiểm tra student_id có tồn tại không
    Student.findById(student_id)
      .then(student => {
        if (!student) {
          return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        if (student.status !== 1) {
          return res.status(403).json({ error: 'Chỉ có thể thao tác với học sinh đang hoạt động' });
        }
        req.student = student;
        next();
      })
      .catch(err => {
        console.error('Lỗi kiểm tra student:', err);
        return res.status(400).json({ error: 'student_id không hợp lệ', details: err.message });
      });
  }
];

// Chức năng checkin
const checkIn = async (req, res) => {
  try {
    const { student_id, report_date } = req.body;
    const user_id = req.user.id; // Lấy user_id từ token đã xác thực
    
    console.log('Checkin request:', { student_id, user_id, report_date });
    
    // Tìm teacher_id từ user_id
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      console.log('Teacher not found for user_id:', user_id);
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }
    const teacher_id = teacher._id;
    console.log('Teacher found:', teacher_id);
    
    // Tìm lớp mà giáo viên phụ trách đối với học sinh
    console.log('=== CHECKIN DEBUG: Finding class for student ===');
    console.log('Student ID:', student_id);
    console.log('Teacher ID:', teacher_id);
    
    const classDoc = await getTeacherClassForStudent(student_id, teacher_id);
    if (!classDoc) {
      console.log('Class not found for student:', student_id, 'teacher:', teacher_id);
      return res.status(403).json({ error: 'Học sinh không thuộc lớp mà bạn phụ trách' });
    }
    
    console.log('=== CHECKIN DEBUG: Class selected ===');
    console.log('Selected class ID:', classDoc._id);
    console.log('Selected class name:', classDoc.class_name);
    console.log('Selected class academic_year:', classDoc.academic_year);
    
    // Log tất cả các lớp mà giáo viên phụ trách
    const Class = require('../models/Class');
    const teacherClasses = await Class.find({
      $or: [{ teacher_id: teacher_id }, { teacher_id2: teacher_id }]
    }).select('_id class_name academic_year');
    console.log('All classes teacher is assigned to:', teacherClasses.map(c => ({
      class_id: c._id,
      class_name: c.class_name,
      academic_year: c.academic_year
    })));
    console.log('=== END CHECKIN DEBUG: Class info ===');
    
    // Sử dụng ngày từ request hoặc ngày hiện tại
    // Tạo Date từ string date (không thêm timezone) để nhất quán với getDateRange
    let targetDate;
    if (report_date) {
      // Parse date string như "2025-12-22" thành Date với local time
      targetDate = new Date(report_date);
    } else {
      const now = new Date();
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const currentTime = new Date().toTimeString().split(' ')[0]; // Format HH:MM:SS
    console.log('Target date:', targetDate.toISOString(), 'Current time:', currentTime);

    const hasSchedule = await hasScheduleForClassDate(classDoc._id, targetDate);
    if (!hasSchedule) {
      return res.status(400).json({ error: 'Lớp không có lịch học trong ngày đã chọn' });
    }
    
    // Kiểm tra xem đã có báo cáo cho ngày đã chọn chưa
    console.log('Looking for existing report for student:', student_id, 'on date:', targetDate);
    const existingReport = await DailyReport.findOne({
      student_id: student_id,
      report_date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('Found existing report:', existingReport);
    
    if (existingReport) {
      console.log('Student already checked in today');
      return res.status(400).json({ 
        error: 'Học sinh đã được checkin hôm nay',
        existing_report: existingReport
      });
    }
    
    // Tạo báo cáo mới
    const newReport = new DailyReport({
      report_date: targetDate,
      checkin_time: currentTime,
      // checkout_time sẽ được thêm khi checkout
      comments: '', // Comments sẽ được thêm khi đánh giá cuối ngày
      student_id: student_id,
      teacher_checkin_id: teacher_id
      // teacher_checkout_id sẽ được thêm khi checkout
    });
    
    const savedReport = await newReport.save();
    
    res.status(201).json({
      message: 'Checkin thành công',
      report: savedReport,
      date: targetDate.toISOString().split('T')[0] // Trả về định dạng yyyy-mm-dd
    });
    
  } catch (error) {
    console.error('Lỗi checkin:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi checkin',
      details: error.message 
    });
  }
};

// Chức năng checkout
const checkOut = async (req, res) => {
  try {
    const { student_id, report_date } = req.body;
    const user_id = req.user.id; // Lấy user_id từ token đã xác thực
    
    console.log('Checkout request:', { student_id, user_id, report_date });
    
    // Tìm teacher_id từ user_id
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      console.log('Teacher not found for user_id:', user_id);
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }
    const teacher_id = teacher._id;
    console.log('Teacher found:', teacher_id);
    
    // Tìm lớp mà giáo viên phụ trách đối với học sinh
    const classDoc = await getTeacherClassForStudent(student_id, teacher_id);
    if (!classDoc) {
      return res.status(403).json({ error: 'Học sinh không thuộc lớp mà bạn phụ trách' });
    }
    
    // Sử dụng ngày từ request hoặc ngày hiện tại
    // Truyền report_date (string) trực tiếp vào hasScheduleForClassDate để parse đúng
    let targetDate;
    let dateForScheduleCheck;
    if (report_date) {
      dateForScheduleCheck = report_date; // Truyền string để parse đúng local time
      // Tạo Date object để lưu vào DailyReport
      const [year, month, day] = report_date.split('-').map(Number);
      targetDate = new Date(year, month - 1, day);
    } else {
      const now = new Date();
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      dateForScheduleCheck = `${year}-${month}-${day}`;
    }
    
    const currentTime = new Date().toTimeString().split(' ')[0]; // Format HH:MM:SS
    console.log('Target date:', targetDate.toISOString(), 'Date for schedule check:', dateForScheduleCheck, 'Current time:', currentTime);

    const hasSchedule = await hasScheduleForClassDate(classDoc._id, dateForScheduleCheck);
    if (!hasSchedule) {
      return res.status(400).json({ error: 'Lớp không có lịch học trong ngày đã chọn' });
    }
    
    // Tìm báo cáo của học sinh trong ngày đã chọn
    console.log('Looking for report for student:', student_id, 'on date:', targetDate);
    const existingReport = await DailyReport.findOne({
      student_id: student_id,
      report_date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('Found report:', existingReport);
    
    if (!existingReport) {
      console.log('No report found for student:', student_id);
      return res.status(404).json({ 
        error: 'Không tìm thấy báo cáo checkin của học sinh hôm nay'
      });
    }
    
    // Kiểm tra xem đã checkout chưa
    if (existingReport.checkout_time) {
      console.log('Student already checked out:', existingReport.checkout_time);
      return res.status(400).json({ 
        error: 'Học sinh đã được checkout hôm nay',
        existing_report: existingReport
      });
    }
    
    // Cập nhật thông tin checkout
    existingReport.checkout_time = currentTime;
    existingReport.teacher_checkout_id = teacher_id;
    // Không thay đổi comments - sẽ được cập nhật riêng khi đánh giá
    
    const updatedReport = await existingReport.save();
    
    res.status(200).json({
      message: 'Checkout thành công',
      report: updatedReport,
      date: targetDate.toISOString().split('T')[0] // Trả về định dạng yyyy-mm-dd
    });
    
  } catch (error) {
    console.error('Lỗi checkout:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi checkout',
      details: error.message 
    });
  }
};

// Cập nhật comments của báo cáo DailyReport (Đánh giá học sinh)
const updateComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { comments, report_date } = req.body;
    const user_id = req.user.id;
    const todayStr = getTodayVietnam(); // Sử dụng múi giờ Việt Nam
    let reqDateStr = '';
    if (report_date) {
      reqDateStr = new Date(report_date).toISOString().split('T')[0];
    }
    console.log('--- [DEBUG updateComment] ---');
    console.log('reportId:', reportId);
    console.log('comments:', comments);
    console.log('report_date (client):', report_date);
    console.log('reqDateStr:', reqDateStr);
    console.log('user_id:', user_id);
    console.log('server today (Vietnam):', todayStr);
    // Tìm teacher tương ứng với user_id
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      console.log('Không tìm thấy teacher với user_id:', user_id);
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }
    const teacher_id = teacher._id;
    console.log('teacher_id:', teacher_id);
    // Check report today theo student (bất kể student truyền là id report hay id student)
    const Student = require('../models/Student');
    let report = null;
    let student = null;
    // Nếu truyền vào report id thì tìm thử có report không
    report = await DailyReport.findById(reportId);
    if (report) {
      // Nếu vừa khớp student_id, vừa đúng ngày mới cho sửa
      // Chuyển report_date sang múi giờ Việt Nam để so sánh
      const reportDateStr = getDateVietnam(report.report_date);
      if (reportDateStr !== todayStr) {
        console.log('Chỉ được phép nhận xét ngày hôm nay (reportDateStr !== todayStr)');
        console.log('reportDateStr:', reportDateStr, 'todayStr:', todayStr);
        return res.status(403).json({ error: 'Chỉ được phép nhận xét ngày hôm nay!' });
      }
      // Kiểm tra giáo viên có phải giáo viên của lớp học sinh không
      const classDoc = await getTeacherClassForStudent(report.student_id, teacher_id);
      if (!classDoc) {
        return res.status(403).json({ error: 'Học sinh không thuộc lớp mà bạn phụ trách' });
      }
      
      // Check quyền: giáo viên có thể cập nhật nếu là giáo viên checkin, checkout, hoặc giáo viên của lớp học sinh
      const isCheckinTeacher = report.teacher_checkin_id && report.teacher_checkin_id.equals(teacher_id);
      const isCheckoutTeacher = report.teacher_checkout_id && report.teacher_checkout_id.equals(teacher_id);
      
      if (!isCheckinTeacher && !isCheckoutTeacher) {
        // Nếu không phải giáo viên checkin/checkout, vẫn cho phép nếu là giáo viên của lớp (đã kiểm tra ở trên)
        console.log('Cập nhật nhận xét bởi giáo viên lớp - teacher_checkin_id:', report.teacher_checkin_id, 'teacher_checkout_id:', report.teacher_checkout_id, 'teacher_id:', teacher_id);
      }
      const hasSchedule = await hasScheduleForClassDate(classDoc._id, report.report_date);
      if (!hasSchedule) {
        return res.status(400).json({ error: 'Lớp không có lịch học trong ngày này nên không thể nhận xét' });
      }
      // Cập nhật nhận xét
      report.comments = comments;
      const updated = await report.save();
      console.log('Cập nhật comments thành công cho report:', updated._id);
      return res.status(200).json({ message: 'Đánh giá học sinh thành công', report: updated });
    } else {
      // Nếu id này là student_id:
      student = await Student.findById(reportId);
      if (!student) {
        return res.status(404).json({ error: 'Không tìm thấy học sinh!' });
      }
      // kiểm tra đã có report hôm nay chưa
      // Tính ngày bắt đầu và kết thúc theo múi giờ Việt Nam
      // Để tránh lệch múi giờ giữa môi trường local và deploy, dùng year-month-day tách rời
      const [year, month, day] = todayStr.split('-').map(Number);
      const todayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const todayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      const classDoc = await getTeacherClassForStudent(student._id, teacher_id);
      if (!classDoc) {
        return res.status(403).json({ error: 'Học sinh không thuộc lớp mà bạn phụ trách' });
      }
      // Quan trọng: dùng todayStr (YYYY-MM-DD) để kiểm tra lịch, tránh lệch múi giờ trên server deploy (UTC)
      const hasSchedule = await hasScheduleForClassDate(classDoc._id, todayStr);
      if (!hasSchedule) {
        return res.status(400).json({ error: 'Lớp không có lịch học hôm nay nên không thể nhận xét' });
      }
      let reportToday = await DailyReport.findOne({
        student_id: student._id,
        report_date: {
          $gte: todayStart,
          $lt: new Date(todayEnd.getTime() + 1000) // Thêm 1 giây để bao gồm 23:59:59
        }
      });
      if (reportToday) {
        // Update comments cho report này
        // Check quyền: giáo viên có thể cập nhật nếu là giáo viên checkin, checkout, hoặc giáo viên của lớp học sinh
        const isCheckinTeacher = reportToday.teacher_checkin_id && reportToday.teacher_checkin_id.equals(teacher_id);
        const isCheckoutTeacher = reportToday.teacher_checkout_id && reportToday.teacher_checkout_id.equals(teacher_id);
        const isClassTeacher = await getTeacherClassForStudent(reportToday.student_id, teacher_id);
        
        if (!isCheckinTeacher && !isCheckoutTeacher && !isClassTeacher) {
          return res.status(403).json({ error: 'Bạn không có quyền cập nhật nhận xét báo cáo này' });
        }
        reportToday.comments = comments;
        const updated = await reportToday.save();
        return res.status(200).json({ message: 'Đánh giá học sinh thành công', report: updated });
      } else {
        // Chưa có report, tạo mới cho hôm nay với comments (không checkin)
        // Khi chỉ comment, không cần teacher_checkin_id
        const [yearCreate, monthCreate, dayCreate] = todayStr.split('-').map(Number);
        const todayStartLocal = new Date(yearCreate, monthCreate - 1, dayCreate, 0, 0, 0, 0);
        let newReport = new DailyReport({
          report_date: todayStartLocal,
          checkin_time: undefined,
          checkout_time: undefined,
          comments: comments || 'Nghỉ',
          student_id: student._id
          // Không set teacher_checkin_id khi chỉ comment (không checkin)
        });
        await newReport.save();
        return res.status(201).json({ message: 'Tự động tạo báo cáo nghỉ cho học sinh', report: newReport });
      }
    }
  } catch (error) {
    console.error('[ERROR updateComment]', error);
    res.status(500).json({
      error: 'Lỗi server khi đánh giá học sinh',
      details: error.message
    });
  }
};

// Lấy lịch sử daily reports của học sinh theo tuần
const getStudentWeeklyReports = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { week_start } = req.query; // Format: YYYY-MM-DD (ngày đầu tuần, thường là thứ 2)
    
    if (!student_id) {
      return res.status(400).json({ error: 'student_id là bắt buộc' });
    }
    
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    
    // Kiểm tra student có tồn tại không
    const Student = require('../models/Student');
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    
    // Tính toán khoảng thời gian tuần
    let weekStart, weekEnd;
    if (week_start) {
      // Parse ngày đầu tuần (thứ 2)
      const date = new Date(week_start + 'T00:00:00.000Z');
      weekStart = new Date(date);
      weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 7); // 7 ngày sau
    } else {
      // Mặc định: tuần hiện tại (thứ 2 đến chủ nhật)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Đưa về thứ 2
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
    }
    
    // Tìm tất cả daily reports trong tuần
    const reports = await DailyReport.find({
      student_id: student_id,
      report_date: {
        $gte: weekStart,
        $lt: weekEnd
      }
    })
      .sort({ report_date: 1 })
      .populate({ path: 'teacher_checkin_id', populate: { path: 'user_id', select: 'full_name avatar_url' } })
      .populate({ path: 'teacher_checkout_id', populate: { path: 'user_id', select: 'full_name avatar_url' } })
      .lean();
    
    return res.status(200).json({
      success: true,
      data: reports,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: new Date(weekEnd.getTime() - 1).toISOString().split('T')[0]
    });
    
  } catch (error) {
    console.error('[ERROR getStudentWeeklyReports]', error);
    res.status(500).json({
      error: 'Lỗi server khi lấy lịch sử báo cáo',
      details: error.message
    });
  }
};


module.exports = {
  studentValidators,
  checkIn,
  checkOut,
  updateComment,
  getStudentWeeklyReports,
};
