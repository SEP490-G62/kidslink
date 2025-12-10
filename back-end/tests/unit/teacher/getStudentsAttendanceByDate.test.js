const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const User = require('../../../src/models/User');
const StudentClass = require('../../../src/models/StudentClass');
const ClassModel = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Teacher = require('../../../src/models/Teacher');
const School = require('../../../src/models/School');
const DailyReport = require('../../../src/models/DailyReport');
const Calendar = require('../../../src/models/Calendar');
const Slot = require('../../../src/models/Slot');
const { getStudentsAttendanceByDate } = require('../../../src/controllers/teacherController');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/teachers/class/students/attendance/:date', getStudentsAttendanceByDate);
  return app;
}

const createTestSchool = async (name = 'School') => {
  const suffix = `${Date.now()}${Math.random()}`;
  return School.create({
    school_name: `${name} ${suffix}`,
    address: '123 Test St',
    phone: `09${suffix.slice(-8)}`,
    email: `school_${suffix}@test.com`,
    logo_url: 'https://example.com/logo.png'
  });
};

const createUserWithRole = async (school_id, role) => {
  const suffix = `${Date.now()}${Math.random()}`;
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${suffix}`,
    password_hash: 'hash',
    role,
    school_id,
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    email: `${role}_${suffix}@test.com`,
    phone_number: `091234${suffix.slice(-4)}`
  });
};

const createTeacherUserAndProfile = async (school_id) => {
  const user = await createUserWithRole(school_id, 'teacher');
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Education',
    experience_years: 3,
    note: 'Homeroom'
  });
  return { user, teacher };
};

const createClassAge = async (school_id) => {
  return ClassAge.create({
    school_id,
    age_name: '3-4',
    age: 3
  });
};

const createClass = async (school_id, classAge_id, teacher_id, teacher_id2 = null) => {
  return ClassModel.create({
    class_name: 'Lớp A1',
    school_id,
    class_age_id: classAge_id,
    teacher_id: teacher_id,
    teacher_id2: teacher_id2,
    academic_year: '2024-2025',
    start_date: '2024-09-01',
    end_date: '2025-06-30'
  });
};

const createSlot = async (school_id = null) => {
  return Slot.create({
    school_id: school_id || new mongoose.Types.ObjectId(),
    slot_name: 'Buổi sáng',
    start_time: '08:00',
    end_time: '11:00'
  });
};

const createStudent = async (school_id, name = null) => {
  return Student.create({
    full_name: name || `Student ${Date.now()}${Math.random()}`,
    gender: Math.random() > 0.5 ? 0 : 1,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id: school_id
  });
};

const createDailyReport = async (student_id, report_date, teacher_checkin_id, checkin_time = '08:30:00', checkout_time = null) => {
  return DailyReport.create({
    student_id,
    report_date: new Date(report_date),
    checkin_time,
    checkout_time,
    teacher_checkin_id,
    teacher_checkout_id: checkout_time ? teacher_checkin_id : null,
    comments: 'Test comment'
  });
};

const createCalendar = async (class_id, slot_id, date, teacher_id, activity_id, weekday_id) => {
  return Calendar.create({
    class_id,
    slot_id,
    date: new Date(date),
    teacher_id: teacher_id || new mongoose.Types.ObjectId(),
    activity_id: activity_id || new mongoose.Types.ObjectId(),
    weekday_id: weekday_id || new mongoose.Types.ObjectId()
  });
};

describe('teacherController - getStudentsAttendanceByDate', () => {
  beforeEach(async () => {
    await Promise.all([
      Student.deleteMany({}),
      User.deleteMany({}),
      StudentClass.deleteMany({}),
      ClassModel.deleteMany({}),
      ClassAge.deleteMany({}),
      Teacher.deleteMany({}),
      School.deleteMany({}),
      DailyReport.deleteMany({}),
      Calendar.deleteMany({}),
      Slot.deleteMany({})
    ]);
  });

  it('[GAD01] Lấy danh sách điểm danh học sinh theo ngày (có class_id)', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student1 = await createStudent(school._id, 'Student 1');
    const student2 = await createStudent(school._id, 'Student 2');
    await StudentClass.create({ student_id: student1._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: student2._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    await createDailyReport(student1._id, testDate, teacher._id, '08:30:00', '11:30:00');
    await createDailyReport(student2._id, testDate, teacher._id, '08:45:00', null);

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.class_info.class_name).toBe('Lớp A1');
    expect(res.body.statistics.total_students).toBe(2);
    expect(res.body.statistics.checked_in).toBe(2);
    expect(res.body.statistics.checked_out).toBe(1);
    expect(res.body.statistics.attendance_rate).toBe(100);
    console.log('\n[GAD01] students:', res.body.students.length, 'checked_in:', res.body.statistics.checked_in, 'checked_out:', res.body.statistics.checked_out);
  });

  it('[GAD02] Lấy danh sách điểm danh của lớp mới nhất (không có class_id)', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    
    // Tạo hai lớp, lớp mới nhất là 2025-2026
    const cls2024 = await createClass(school._id, classAge._id, teacher._id);
    cls2024.academic_year = '2024-2025';
    await cls2024.save();

    const cls2025 = await createClass(school._id, classAge._id, teacher._id);
    cls2025.academic_year = '2025-2026';
    cls2025.class_name = 'Lớp A2';
    await cls2025.save();

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls2025._id, academic_year: '2025-2026' });

    const testDate = '2024-12-08';
    await createDailyReport(student._id, testDate, teacher._id, '08:30:00');

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}`);

    expect(res.status).toBe(200);
    expect(res.body.class_info.class_name).toBe('Lớp A2');
    expect(res.body.class_info.academic_year).toBe('2025-2026');
    console.log('\n[GAD02] latest class:', res.body.class_info.class_name, 'year:', res.body.class_info.academic_year);
  });

  it('[GAD03] Ngày không hợp lệ trả 400', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/invalid-date?class_id=${cls._id}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ngày không hợp lệ');
    console.log('\n[GAD03] status:', res.status, 'error:', res.body.error);
  });

  it('[GAD04] URL path phải có ngày, nếu không Express trả 404', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/?class_id=${cls._id}`);

    // Express sẽ trả 404 nếu path không match route (ngày là required param)
    expect(res.status).toBe(404);
    console.log('\n[GAD04] status:', res.status, '(required date param)');
  });

  it('[GAD05] Giáo viên không tìm thấy trả 404', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    // Sử dụng user_id không tồn tại
    const fakeUserId = new mongoose.Types.ObjectId();
    const app = buildApp({ id: fakeUserId.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/2024-12-08?class_id=${cls._id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy giáo viên');
    console.log('\n[GAD05] status:', res.status, 'error:', res.body.error);
  });

  it('[GAD06] Giáo viên không có lớp nào trả 404', async () => {
    const school = await createTestSchool();
    const { user: teacherUser } = await User.create({
      full_name: 'Teacher User',
      username: `teacher_${Date.now()}${Math.random()}`,
      password_hash: 'hash',
      role: 'teacher',
      school_id: school._id,
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      email: `teacher_${Date.now()}${Math.random()}@test.com`,
      phone_number: `091234${Math.random().toString().slice(-4)}`
    }).then(u => ({ _id: u._id, user: u }));

    const teacher = await Teacher.create({
      user_id: teacherUser.user ? teacherUser.user._id : teacherUser._id,
      qualification: 'Bachelor',
      major: 'Education',
      experience_years: 1,
      note: 'Giáo viên chuyên'
    });

    const userId = teacherUser.user ? teacherUser.user._id : teacherUser._id;
    const app = buildApp({ id: userId.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/2024-12-08`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Giáo viên chưa có lớp học');
    console.log('\n[GAD06] status:', res.status, 'error:', res.body.error);
  });

  it('[GAD07] Class_id không hợp lệ, không tìm thấy lớp trả 403', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    // Tạo lớp khác mà giáo viên này không dạy
    const anotherTeacher = (await createTeacherUserAndProfile(school._id)).teacher;
    const anotherClass = await createClass(school._id, classAge._id, anotherTeacher._id);

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/2024-12-08?class_id=${anotherClass._id}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Không có quyền truy cập lớp này');
    console.log('\n[GAD07] status:', res.status, 'error:', res.body.error);
  });

  it('[GAD08] Lớp không có học sinh trả về array rỗng', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const testDate = '2024-12-08';
    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(0);
    expect(res.body.statistics.total_students).toBe(0);
    expect(res.body.statistics.checked_in).toBe(0);
    expect(res.body.statistics.checked_out).toBe(0);
    expect(res.body.statistics.attendance_rate).toBe(0);
    console.log('\n[GAD08] empty class, total_students:', res.body.statistics.total_students);
  });

  it('[GAD09] Học sinh không có check-in trong ngày', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student1 = await createStudent(school._id);
    const student2 = await createStudent(school._id);
    await StudentClass.create({ student_id: student1._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: student2._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    await createDailyReport(student1._id, testDate, teacher._id, '08:30:00');
    // student2 không có report

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(2);
    const student2Data = res.body.students.find(s => s._id.toString() === student2._id.toString());
    expect(student2Data.attendance.has_checkin).toBe(false);
    expect(student2Data.attendance.has_checkout).toBe(false);
    expect(res.body.statistics.checked_in).toBe(1);
    expect(res.body.statistics.attendance_rate).toBe(50);
    console.log('\n[GAD09] attendance_rate:', res.body.statistics.attendance_rate, 'checked_in:', res.body.statistics.checked_in);
  });

  it('[GAD10] Teacher_id2 (phó chủ nhiệm) có thể xem điểm danh', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher: mainTeacher } = await createTeacherUserAndProfile(school._id);
    const { teacher: assistantTeacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, mainTeacher._id, assistantTeacher._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    await createDailyReport(student._id, testDate, mainTeacher._id, '08:30:00');

    const app = buildApp({ id: assistantTeacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].attendance.has_checkin).toBe(true);
    console.log('\n[GAD10] teacher_id2 can access, students:', res.body.students.length);
  });

  it('[GAD11] Thông tin học sinh được populate đầy đủ', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id, 'Nguyễn Văn A');
    student.gender = 0;
    student.allergy = 'Egg';
    await student.save();

    await StudentClass.create({ 
      student_id: student._id, 
      class_id: cls._id, 
      academic_year: '2024-2025',
      discount: 10
    });

    const testDate = '2024-12-08';
    await createDailyReport(student._id, testDate, teacher._id, '08:30:00', '11:30:00');

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.students[0].full_name).toBe('Nguyễn Văn A');
    expect(res.body.students[0].gender).toBe(0);
    expect(res.body.students[0].allergy).toBe('Egg');
    expect(res.body.students[0].avatar_url).toBeDefined();
    expect(res.body.students[0].dob).toBeDefined();
    expect(res.body.students[0].status).toBe(1);
    expect(res.body.students[0].discount).toBe(10);
    console.log('\n[GAD11] student data populated:', {
      full_name: res.body.students[0].full_name,
      gender: res.body.students[0].gender,
      allergy: res.body.students[0].allergy,
      discount: res.body.students[0].discount
    });
  });

  it('[GAD12] Thông tin lớp được populate đầy đủ', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.class_info._id).toBeDefined();
    expect(res.body.class_info.class_name).toBe('Lớp A1');
    expect(res.body.class_info.academic_year).toBe('2024-2025');
    expect(res.body.class_info.class_age).toBeDefined();
    expect(res.body.class_info.school).toBeDefined();
    console.log('\n[GAD12] class_info:', {
      class_name: res.body.class_info.class_name,
      academic_year: res.body.class_info.academic_year
    });
  });

  it('[GAD13] Phát hiện lịch dạy (has_schedule)', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);
    const slot = await createSlot(school._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    // Tạo lịch dạy cho ngày này
    await createCalendar(cls._id, slot._id, testDate);

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.has_schedule).toBe(true);
    console.log('\n[GAD13] has_schedule:', res.body.has_schedule);
  });

  it('[GAD14] Không có lịch dạy trong ngày', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.has_schedule).toBe(false);
    console.log('\n[GAD14] has_schedule:', res.body.has_schedule);
  });

  it('[GAD15] Kỳ vọng định dạng response chính xác', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const testDate = '2024-12-08';
    await createDailyReport(student._id, testDate, teacher._id, '08:30:00', '11:30:00');

    const app = buildApp({ id: teacher.user_id.toString(), role: 'teacher' });
    const res = await request(app).get(`/teachers/class/students/attendance/${testDate}?class_id=${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('class_id');
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('class_info');
    expect(res.body).toHaveProperty('statistics');
    expect(res.body).toHaveProperty('students');
    expect(res.body).toHaveProperty('has_schedule');
    
    // Check statistics structure
    expect(res.body.statistics).toHaveProperty('total_students');
    expect(res.body.statistics).toHaveProperty('checked_in');
    expect(res.body.statistics).toHaveProperty('checked_out');
    expect(res.body.statistics).toHaveProperty('attendance_rate');
    
    // Check student structure
    expect(res.body.students[0]).toHaveProperty('_id');
    expect(res.body.students[0]).toHaveProperty('full_name');
    expect(res.body.students[0]).toHaveProperty('gender');
    expect(res.body.students[0]).toHaveProperty('attendance');
    expect(res.body.students[0]).toHaveProperty('discount');
    expect(res.body.students[0].attendance).toHaveProperty('has_checkin');
    expect(res.body.students[0].attendance).toHaveProperty('has_checkout');
    expect(res.body.students[0].attendance).toHaveProperty('checkin_time');
    expect(res.body.students[0].attendance).toHaveProperty('checkout_time');
    
    console.log('\n[GAD15] Response structure verified');
  });
});
