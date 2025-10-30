const mongoose = require('mongoose');
const { Class, Student, StudentClass, HealthRecord, HealthNotice, HealthCareStaff } = require('../models');
const User = require('../models/User');

// Helper: Lấy đối tượng HealthCareStaff từ user hiện tại (từ JWT)
async function getStaffByReqUser(req) {
  const userId = req?.user?.id;
  if (!userId) return null;
  return await HealthCareStaff.findOne({ user_id: userId });
}

/**
 * GET /health-staff/classes
 * Lấy danh sách lớp trong trường
 */
exports.listClasses = async (req, res) => {
  try {
    const classes = await Class.find()
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
 * Lấy danh sách học sinh của một lớp
 */
exports.listStudentsByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(class_id)) {
      return res.status(400).json({ error: 'class_id không hợp lệ' });
    }
    const mappings = await StudentClass.find({ class_id })
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
    return res.json({ class_id, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/health/records?student_id=...
 * Lấy danh sách sổ sức khoẻ của một học sinh
 */
exports.listHealthRecordsByStudent = async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
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
 * Tạo mới sổ sức khoẻ học sinh
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
 * Cập nhật sổ sức khoẻ
 */
exports.updateHealthRecord = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { checkup_date, height_cm, weight_kg, note } = req.body;
    if (!mongoose.Types.ObjectId.isValid(record_id)) {
      return res.status(400).json({ error: 'record_id không hợp lệ' });
    }
    const record = await HealthRecord.findById(record_id);
    if (!record) return res.status(404).json({ error: 'Không tìm thấy sổ sức khoẻ' });
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
 * Xóa sổ sức khỏe học sinh
 */
exports.deleteHealthRecord = async (req, res) => {
  try {
    const { record_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(record_id)) {
      return res.status(400).json({ error: 'record_id không hợp lệ' });
    }
    const deleted = await HealthRecord.findByIdAndDelete(record_id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy record để xóa' });
    return res.json({ message: 'Đã xóa sổ sức khoẻ thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};

/**
 * GET /health-staff/health/notices?student_id=...
 * Lấy danh sách thông báo y tế của một học sinh
 */
exports.listHealthNoticesByStudent = async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
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
 * Thêm mới thông báo y tế cho học sinh
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
 * Cập nhật thông báo y tế
 */
exports.updateHealthNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notice_id)) {
      return res.status(400).json({ error: 'notice_id không hợp lệ' });
    }
    const { symptoms, actions_taken, medications, notice_time, note } = req.body;
    const notice = await HealthNotice.findById(notice_id);
    if (!notice) return res.status(404).json({ error: 'Không tìm thấy notice' });
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
 * Xóa thông báo y tế
 */
exports.deleteHealthNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notice_id)) {
      return res.status(400).json({ error: 'notice_id không hợp lệ' });
    }
    const deleted = await HealthNotice.findByIdAndDelete(notice_id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy notice để xóa' });
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
    const { full_name, avatar_url, email, phone_number, password } = req.body;
    if (full_name) user.full_name = full_name;
    if (avatar_url) user.avatar_url = avatar_url;
    if (email) user.email = email;
    if (phone_number) user.phone_number = phone_number;
    if (password) user.password_hash = await require('bcryptjs').hash(password, 12);
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
