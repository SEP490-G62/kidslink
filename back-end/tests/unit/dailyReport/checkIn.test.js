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
    DailyReport.deleteMany({})
  ]);
});

// Helpers --------------------------------------------------
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
    major: 'Math',
    experience_years: 3,
    note: 'Homeroom'
  });
  return { user, teacher };
};

const createUserWithRole = async (role, data = {}) => {
  return User.create({
    full_name: data.full_name || 'User',
    username: data.username || `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: 'hash',
    avatar_url: 'https://via.placeholder.com/150',
    role,
    school_id: data.school_id || null,
    status: 1
  });
};

const createTestClass = async (school_id, teacher_id, academicYear = '2024-2025') => {
  const classAge = await ClassAge.create({ age: 5, age_name: '5', school_id });
  return Class.create({
    class_name: 'Class A',
    academic_year: academicYear,
    school_id,
    class_age_id: classAge._id,
    teacher_id,
    start_date: new Date('2024-09-01'),
    end_date: new Date('2025-05-31')
  });
};

const createStudent = async (school_id, overrides = {}) => {
  return Student.create({
    full_name: overrides.full_name || 'Student',
    dob: overrides.dob || new Date('2015-01-01'),
    gender: overrides.gender !== undefined ? overrides.gender : 0,
    avatar_url: overrides.avatar_url || 'https://via.placeholder.com/150',
    status: overrides.status !== undefined ? overrides.status : 1,
    school_id
  });
};

// Mock Calendar check - bypass by mocking Calendar.exists
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
  app.post('/api/checkin', 
    dailyReportController.studentValidators,
    dailyReportController.checkIn
  );
  return app;
};

// Tests --------------- ----------------------------------------
describe('checkIn', () => {
  it('CHIN01: Teacher successfully checks in student', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHIN School');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student1' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Checkin thành công');
    expect(res.body.report).toBeDefined();
    expect(res.body.report.student_id).toBe(student._id.toString());
  });

  it('CHIN02: Fails if student_id is missing', async () => {
    const school = await createTestSchool('CHIN School 2');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('student_id là bắt buộc');
  });

  it('CHIN03: Fails if student_id is invalid ObjectId format', async () => {
    const school = await createTestSchool('CHIN School 3');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: 'invalid-id',
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('student_id không hợp lệ');
  });

  it('CHIN04: Fails if student not found', async () => {
    const school = await createTestSchool('CHIN School 4');
    const { user: teacher_user } = await createTeacherUserAndProfile(school._id);
    const nonExistentId = new mongoose.Types.ObjectId();
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: nonExistentId.toString(),
        report_date: today,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy học sinh');
  });

  it('CHIN05: Fails if student is inactive (status != 1)', async () => {
    const school = await createTestSchool('CHIN School 5');
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
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Chỉ có thể thao tác với học sinh đang hoạt động');
  });

  it('CHIN06: Fails if student is not in teacher\'s class', async () => {
    const school = await createTestSchool('CHIN School 6');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student6' });
    // Don't add student to any class
    
    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Học sinh không thuộc lớp mà bạn phụ trách');
  });

  it('CHIN07: Fails if class has no schedule for the date', async () => {
    // Override mock to return false for this test
    Calendar.exists = jest.fn().mockResolvedValue(false);
    
    const school = await createTestSchool('CHIN School 7');
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
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: futureDateStr,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Lớp không có lịch học trong ngày đã chọn');
  });

  it('CHIN08: Fails if student already checked in today', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHIN School 8');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student8' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    // Create first check-in
    const today = new Date().toISOString().split('T')[0];
    await DailyReport.create({
      report_date: new Date(today + 'T00:00:00Z'),
      checkin_time: '09:00:00',
      student_id: student._id,
      teacher_checkin_id: teacher._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Học sinh đã được checkin hôm nay');
  });

  it('CHIN09: Uses current date if report_date not provided', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHIN School 9');
    const { user: teacher_user, teacher } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student9' });
    const classDoc = await createTestClass(school._id, teacher._id);
    
    await StudentClass.create({
      student_id: student._id,
      class_id: classDoc._id
    });

    const app = buildAppWithUser({ id: teacher_user._id.toString(), role: 'teacher', username: teacher_user.username });
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
      });

    expect(res.status).toBe(201);
    // Check that date is in valid format (YYYY-MM-DD)
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('CHIN10: Teacher with teacher_id2 can also check in student', async () => {
    mockCalendarExists();
    const school = await createTestSchool('CHIN School 10');
    const { user: teacher_user1, teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { user: teacher_user2, teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const student = await createStudent(school._id, { full_name: 'Student10' });
    
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

    // Teacher2 should be able to check in
    const app = buildAppWithUser({ id: teacher_user2._id.toString(), role: 'teacher', username: teacher_user2.username });
    const today = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .post('/api/checkin')
      .send({
        student_id: student._id.toString(),
        report_date: today,
      });

    expect(res.status).toBe(201);
    expect(res.body.report.teacher_checkin_id).toBe(teacher2._id.toString());
  });
});

