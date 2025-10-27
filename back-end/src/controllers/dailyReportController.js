const DailyReport = require('../models/DailyReport');
const Student = require('../models/Student');

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
    
    // Sử dụng ngày từ request hoặc ngày hiện tại
    let targetDate;
    if (report_date) {
      targetDate = new Date(report_date + 'T00:00:00.000Z');
    } else {
      const now = new Date();
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const currentTime = new Date().toTimeString().split(' ')[0]; // Format HH:MM:SS
    console.log('Target date:', targetDate, 'Current time:', currentTime);
    
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
    
    // Sử dụng ngày từ request hoặc ngày hiện tại
    let targetDate;
    if (report_date) {
      targetDate = new Date(report_date + 'T00:00:00.000Z');
    } else {
      const now = new Date();
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const currentTime = new Date().toTimeString().split(' ')[0]; // Format HH:MM:SS
    console.log('Target date:', targetDate, 'Current time:', currentTime);
    
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





module.exports = {
  studentValidators,
  checkIn,
  checkOut,
};
