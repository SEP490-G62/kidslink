const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Class, Student, StudentClass, HealthRecord, HealthNotice, HealthCareStaff } = require('../models');
const User = require('../models/User');

// Helper: Lấy đối tượng HealthCareStaff từ user hiện tại (từ JWT)
async function getStaffByReqUser(req) {
  const userId = req?.user?.id;
  if (!userId) return null;
  return await HealthCareStaff.findOne({ user_id: userId });
}

// Helper: Lấy school_id từ user của staff
async function getStaffSchoolId(req) {
  const userId = req?.user?.id;
  if (!userId) return null;
  const user = await User.findById(userId).select('school_id');
  return user?.school_id || null;
}

/**
 * GET /health-staff/classes
 * Lấy danh sách lớp trong trường (chỉ lớp cùng school_id với staff)
 */
exports.listClasses = async (req, res) => {
  try {
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    const classes = await Class.find({ school_id: schoolId })
      .populate('school_id')
      .populate('class_age_id')
      .populate('teacher_id')
      .populate('teacher_id2')
      .sort({ academic_year: -1, class_name: 1 });
    return res.json({ count: classes.length, data: classes });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/classes/:class_id/students
 * Lấy danh sách học sinh của một lớp (chỉ lớp và học sinh cùng school_id với staff)
 */
exports.listStudentsByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(class_id)) {
      return res.status(400).json({ error: 'class_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    // Kiểm tra class có thuộc school_id của staff không
    const classObj = await Class.findById(class_id);
    if (!classObj) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    }
    if (classObj.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập lớp học này' });
    }
    const mappings = await StudentClass.find({ class_id })
      .populate({ path: 'student_id', model: Student });
    // Lọc chỉ lấy students cùng school_id
    const students = mappings
      .filter((m) => {
        if (!m.student_id) return false;
        return m.student_id.school_id && m.student_id.school_id.toString() === schoolId.toString();
      })
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
    return res.json({ class_id, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/health/records?student_id=...
 * Lấy danh sách sổ sức khoẻ của một học sinh (chỉ học sinh cùng school_id với staff)
 */
exports.listHealthRecordsByStudent = async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    // Kiểm tra student có thuộc school_id của staff không
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    if (!student.school_id || student.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập học sinh này' });
    }
    const records = await HealthRecord.find({ student_id })
      .populate('student_id')
      .populate('health_care_staff_id')
      .sort({ checkup_date: -1 });
    return res.json({ student_id, count: records.length, records });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * POST /health-staff/health/records
 * Tạo mới sổ sức khoẻ học sinh (chỉ học sinh cùng school_id với staff)
 */
exports.createHealthRecord = async (req, res) => {
  try {
    const { checkup_date, height_cm, weight_kg, note, student_id } = req.body;
    if (!checkup_date || !height_cm || !weight_kg || !note || !student_id) {
      return res.status(400).json({ error: 'Thiếu trường dữ liệu' });
    }
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    const staff = await getStaffByReqUser(req);
    if (!staff) return res.status(403).json({ error: 'Không tìm thấy nhân viên y tế' });
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    // Kiểm tra student có thuộc school_id của staff không
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    if (!student.school_id || student.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền tạo sổ sức khỏe cho học sinh này' });
    }
    const newRecord = new HealthRecord({
      checkup_date,
      height_cm,
      weight_kg,
      note,
      student_id,
      health_care_staff_id: staff._id
    });
    await newRecord.save();
    return res.status(201).json({ message: 'Tạo sổ sức khoẻ thành công', record: newRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * PUT /health-staff/health/records/:record_id
 * Cập nhật sổ sức khoẻ (chỉ record của học sinh cùng school_id với staff)
 */
exports.updateHealthRecord = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { checkup_date, height_cm, weight_kg, note } = req.body;
    if (!mongoose.Types.ObjectId.isValid(record_id)) {
      return res.status(400).json({ error: 'record_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    const record = await HealthRecord.findById(record_id).populate('student_id');
    if (!record) return res.status(404).json({ error: 'Không tìm thấy sổ sức khoẻ' });
    // Kiểm tra student của record có thuộc school_id của staff không
    if (!record.student_id || !record.student_id.school_id || 
        record.student_id.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền cập nhật sổ sức khỏe này' });
    }
    if (checkup_date) record.checkup_date = checkup_date;
    if (height_cm !== undefined) record.height_cm = height_cm;
    if (weight_kg !== undefined) record.weight_kg = weight_kg;
    if (note !== undefined) record.note = note;
    await record.save();
    return res.json({ message: 'Cập nhật thành công', record });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * DELETE /health-staff/health/records/:record_id
 * Xóa sổ sức khỏe học sinh (chỉ record của học sinh cùng school_id với staff)
 */
exports.deleteHealthRecord = async (req, res) => {
  try {
    const { record_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(record_id)) {
      return res.status(400).json({ error: 'record_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    const record = await HealthRecord.findById(record_id).populate('student_id');
    if (!record) return res.status(404).json({ error: 'Không tìm thấy record để xóa' });
    // Kiểm tra student của record có thuộc school_id của staff không
    if (!record.student_id || !record.student_id.school_id || 
        record.student_id.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa sổ sức khỏe này' });
    }
    await HealthRecord.findByIdAndDelete(record_id);
    return res.json({ message: 'Đã xóa sổ sức khoẻ thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/health/notices?student_id=...
 * Lấy danh sách thông báo y tế của một học sinh (chỉ học sinh cùng school_id với staff)
 */
exports.listHealthNoticesByStudent = async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    // Kiểm tra student có thuộc school_id của staff không
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    if (!student.school_id || student.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập học sinh này' });
    }
    const notices = await HealthNotice.find({ student_id })
      .populate('student_id')
      .populate('health_care_staff_id')
      .sort({ notice_time: -1 });
    return res.json({ student_id, count: notices.length, notices });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * POST /health-staff/health/notices
 * Thêm mới thông báo y tế cho học sinh (chỉ học sinh cùng school_id với staff)
 */
exports.createHealthNotice = async (req, res) => {
  try {
    const { student_id, symptoms, actions_taken, medications, notice_time, note } = req.body;
    if (!student_id || !symptoms || !actions_taken || !medications || !notice_time || !note) {
      return res.status(400).json({ error: 'Thiếu trường dữ liệu' });
    }
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }
    const staff = await getStaffByReqUser(req);
    if (!staff) return res.status(403).json({ error: 'Không tìm thấy nhân viên y tế' });
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    // Kiểm tra student có thuộc school_id của staff không
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }
    if (!student.school_id || student.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền tạo thông báo y tế cho học sinh này' });
    }
    const newNotice = new HealthNotice({
      student_id,
      symptoms,
      actions_taken,
      medications,
      notice_time,
      note,
      health_care_staff_id: staff._id
    });
    await newNotice.save();
    return res.status(201).json({ message: 'Tạo thông báo y tế thành công', notice: newNotice });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * PUT /health-staff/health/notices/:notice_id
 * Cập nhật thông báo y tế (chỉ notice của học sinh cùng school_id với staff)
 */
exports.updateHealthNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notice_id)) {
      return res.status(400).json({ error: 'notice_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    const { symptoms, actions_taken, medications, notice_time, note } = req.body;
    const notice = await HealthNotice.findById(notice_id).populate('student_id');
    if (!notice) return res.status(404).json({ error: 'Không tìm thấy notice' });
    // Kiểm tra student của notice có thuộc school_id của staff không
    if (!notice.student_id || !notice.student_id.school_id || 
        notice.student_id.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền cập nhật thông báo y tế này' });
    }
    if (symptoms) notice.symptoms = symptoms;
    if (actions_taken) notice.actions_taken = actions_taken;
    if (medications) notice.medications = medications;
    if (notice_time) notice.notice_time = notice_time;
    if (note) notice.note = note;
    await notice.save();
    return res.json({ message: 'Đã cập nhật thông báo y tế thành công', notice });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * DELETE /health-staff/health/notices/:notice_id
 * Xóa thông báo y tế (chỉ notice của học sinh cùng school_id với staff)
 */
exports.deleteHealthNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notice_id)) {
      return res.status(400).json({ error: 'notice_id không hợp lệ' });
    }
    const schoolId = await getStaffSchoolId(req);
    if (!schoolId) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin trường học' });
    }
    const notice = await HealthNotice.findById(notice_id).populate('student_id');
    if (!notice) return res.status(404).json({ error: 'Không tìm thấy notice để xóa' });
    // Kiểm tra student của notice có thuộc school_id của staff không
    if (!notice.student_id || !notice.student_id.school_id || 
        notice.student_id.school_id.toString() !== schoolId.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa thông báo y tế này' });
    }
    await HealthNotice.findByIdAndDelete(notice_id);
    return res.json({ message: 'Đã xóa thông báo y tế thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/profile
 * Lấy thông tin profile của staff
 */
exports.getStaffProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId).select('-password_hash');
    if (!user || user.role !== 'health_care_staff') return res.status(403).json({ error: 'Không đúng vai trò health care staff' });
    const staff = await HealthCareStaff.findOne({ user_id: userId });
    return res.json({ user, staff });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * PUT /health-staff/profile
 * Cập nhật thông tin profile của staff
 */
exports.updateStaffProfile = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId);
    if (!user || user.role !== 'health_care_staff') return res.status(403).json({ error: 'Không đúng vai trò health care staff' });

    // update user fields if present
    const { full_name, avatar_url, email, phone_number } = req.body;
    if (full_name) user.full_name = full_name;
    if (avatar_url) user.avatar_url = avatar_url;
    if (email) user.email = email;
    if (phone_number) user.phone_number = phone_number;
    await user.save();

    // update health care staff
    const { qualification, major, experience_years, note } = req.body;
    const staff = await HealthCareStaff.findOne({ user_id: userId });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy health care staff' });
    if (qualification) staff.qualification = qualification;
    if (major) staff.major = major;
    if (experience_years !== undefined) staff.experience_years = experience_years;
    if (note) staff.note = note;
    await staff.save();

    return res.json({ message: 'Cập nhật profile thành công', user, staff });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

exports.changeStaffPassword = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });
    const user = await User.findById(userId);
    if (!user || user.role !== 'health_care_staff') {
      return res.status(403).json({ error: 'Không đúng vai trò health care staff' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Xác nhận mật khẩu mới không khớp' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({ error: 'Mật khẩu phải có từ 8-16 ký tự' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 1 chữ hoa' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 1 chữ thường' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 1 số' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};
