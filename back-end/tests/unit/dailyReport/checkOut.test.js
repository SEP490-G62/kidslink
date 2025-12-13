const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const Teacher = require('../../../src/models/Teacher');
const Student = require('../../../src/models/Student');
const Class = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const StudentClass = require('../../../src/models/StudentClass');
const Calendar = require('../../../src/models/Calendar');
const Slot = require('../../../src/models/Slot');
const DailyReport = require('../../../src/models/DailyReport');
const dailyReportController = require('../../../src/controllers/dailyReportController');

// Cleanup before each test
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    Teacher.deleteMany({}),
    Student.deleteMany({}),
    Class.deleteMany({}),
    ClassAge.deleteMany({}),
    StudentClass.deleteMany({}),
    Calendar.deleteMany({}),
    DailyReport.deleteMany({}),
    Slot.deleteMany({})
  ]);
});

// Helpers
const createTestSchool = async (name = 'Test School') => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return School.create({
    school_name: name,
    address: '123 Test St',
    logo_url: 'https://via.placeholder.com/150',
    phone: `0123456789${uniqueSuffix}`,
    email: `school_${uniqueSuffix}@example.com`
  });
};

const createTeacherUserAndProfile = async (school_id) => {
  const user = await User.create({
    full_name: 'Teacher',
    username: `teacher_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: 'hash',
    avatar_url: 'https://via.placeholder.com/150',
    role: 'teacher',
    school_id,
    status: 1
  });

  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Education',
    experience_years: 3,
    note: 'Homeroom teacher'
  });

  return { user, teacher };
};

const createStudent = async (school_id, options = {}) => {
  const { full_name = `Student_${Date.now()}`, status = 1 } = options;
  return Student.create({
    full_name,
    gender: Math.random() > 0.5 ? 0 : 1,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://via.placeholder.com/150',
    status,
    school_id
  });
};

const createTestClass = async (school_id, teacher_id, teacher_id2 = null) => {
  const classAge = await ClassAge.create({
    age: 5,
    age_name: '5',
    school_id
  });

  return Class.create({
    class_name: 'Class A',
    academic_year: '2024-2025',
    school_id,
    class_age_id: classAge._id,
    teacher_id,
    teacher_id2,
    start_date: new Date('2024-09-01'),
    end_date: new Date('2025-05-31')
  });
};

const mockCalendarExists = () => {
  Calendar.exists = jest.fn().mockResolvedValue(true);
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.put('/api/checkout', 
    dailyReportController.studentValidators,
    dailyReportController.checkOut
  );
  return app;
};

// Tests
describe('checkOut', () => {
  it('CHOUT01: Teacher successfully checks out student', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 1');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student1' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    // Create initial check-in report
    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Checkout thành công');
    expect(res.body.report).toBeDefined();
    expect(res.body.report.student_id).toBe(student._id.toString());
    expect(res.body.report.checkout_time).toBeDefined();
    expect(res.body.report.teacher_checkout_id).toBe(teacher._id.toString());
    console.log('\n[CHOUT01] checkout success:', res.body.report.checkout_time);
  });

  it('CHOUT02: Fails if student_id is missing', async () => {
    const school = await createTestSchool('CHOUT School 2');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('student_id là bắt buộc');
    console.log('\n[CHOUT02] status:', res.status);
  });

  it('CHOUT03: Fails if student_id is invalid ObjectId format', async () => {
    const school = await createTestSchool('CHOUT School 3');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: 'invalid-id',
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('student_id không hợp lệ');
    console.log('\n[CHOUT03] status:', res.status);
  });

  it('CHOUT04: Fails if student not found', async () => {
    const school = await createTestSchool('CHOUT School 4');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    const nonExistentId = new mongoose.Types.ObjectId();
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: nonExistentId.toString(),
        report_date: today,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy học sinh');
    console.log('\n[CHOUT04] status:', res.status);
  });

  it('CHOUT05: Fails if student is inactive', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 5');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student5', status: 0 });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Chỉ có thể thao tác với học sinh đang hoạt động');
    console.log('\n[CHOUT05] status:', res.status);
  });

  it('CHOUT06: Fails if student is not in teacher\'s class', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 6');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student6' });
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Học sinh không thuộc lớp mà bạn phụ trách');
    console.log('\n[CHOUT06] status:', res.status);
  });

  it('CHOUT07: Fails if class has no schedule for the date', async () => {
    Calendar.exists = jest.fn().mockResolvedValue(false);
    
    const school = await createTestSchool('CHOUT School 7');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student7' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: futureDateStr,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Lớp không có lịch học trong ngày đã chọn');
    console.log('\n[CHOUT07] status:', res.status);
  });

  it('CHOUT08: Fails if student has not checked in yet', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 8');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student8' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Không tìm thấy báo cáo checkin/i);
    console.log('\n[CHOUT08] status:', res.status);
  });

  it('CHOUT09: Fails if student already checked out', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 9');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student9' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    // Create report with both checkin and checkout
    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      checkout_time: '16:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      teacher_checkout_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/đã được checkout/i);
    console.log('\n[CHOUT09] status:', res.status);
  });

  it('CHOUT10: Uses current date if report_date not provided', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 10');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student10' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    // Create initial check-in report for today
    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.report.checkout_time).toBeDefined();
    console.log('\n[CHOUT10] uses current date');
  });

  it('CHOUT11: Teacher with teacher_id2 can also check out student', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 11');
    const { user: teacher_user1, teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { user: teacher_user2, teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student11' });
    
    // Create class with teacher1 as primary, teacher2 as secondary
    const classAge = await ClassAge.create({ age: 5, age_name: '5', school_id: school._id });
    const classDoc = await Class.create({
      class_name: 'Class B',
      academic_year: '2024-2025',
      school_id: school._id,
      class_age_id: classAge._id,
      teacher_id: teacher1._id,
      teacher_id2: teacher2._id,
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-05-31')
    });
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    // Create initial check-in by teacher1
    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher1._id,
      comments: ''
    });

    // Teacher2 should be able to check out
    const app = buildAppWithUser({ id: teacher_user2._id.toString(), role: 'teacher', username: teacher_user2.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(200);
    expect(res.body.report.teacher_checkout_id).toBe(teacher2._id.toString());
    console.log('\n[CHOUT11] teacher_id2 can checkout');
  });

  it('CHOUT12: Checkout_time is properly recorded in HH:MM:SS format', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 12');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student12' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(200);
    const checkoutTime = res.body.report.checkout_time;
    // Format HH:MM:SS
    expect(checkoutTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    console.log('\n[CHOUT12] checkout_time format:', checkoutTime);
  });

  it('CHOUT13: Comments field is preserved during checkout', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 13');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student13' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const today = new Date().toISOString().split('T')[0];
    const originalComment = 'Bé ăn uống tốt';
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      comments: originalComment
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(200);
    expect(res.body.report.comments).toBe(originalComment);
    console.log('\n[CHOUT13] comments preserved');
  });

  it('CHOUT14: Response includes correct date format (YYYY-MM-DD)', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 14');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student14' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    console.log('\n[CHOUT14] date format:', res.body.date);
  });

  it('CHOUT15: Multiple students can checkout on same day', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHOUT School 15');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student1 = await createStudent(school._id, { full_name: 'Student15A' });
    const student2 = await createStudent(school._id, { full_name: 'Student15B' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({ student_id: student1._id, class_id: classDoc._id });
    await StudentClass.create({ student_id: student2._id, class_id: classDoc._id });

    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student1._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:30:00',
      student_id: student2._id,
      teacher_checkin_id: teacher._id,
      comments: ''
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res1 = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student1._id.toString(),
        report_date: today,
      });

    const res2 = await request(app)
      .put('/api/checkout')
      .send({
        student_id: student2._id.toString(),
        report_date: today,
      });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.report.student_id).toBe(student1._id.toString());
    expect(res2.body.report.student_id).toBe(student2._id.toString());
    console.log('\n[CHOUT15] multiple students checked out');
  });
});
