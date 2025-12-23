/**
 * Unit tests for addStudentToClass controller
 * Covers class/student validation, academic year constraints, and school_admin scoping.
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const StudentClass = require('../../../src/models/StudentClass');
const ClassModel = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Teacher = require('../../../src/models/Teacher');
const { addStudentToClass } = require('../../../src/controllers/classController');

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

const createTestClass = async (school_id, academicYear = '2024-2025') => {
  const { teacher } = await createTeacherUserAndProfile(school_id);
  const classAge = await ClassAge.create({ age: 5, age_name: '5', school_id });
  return ClassModel.create({
    class_name: 'Class A',
    academic_year: academicYear,
    school_id,
    class_age_id: classAge._id,
    teacher_id: teacher._id,
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

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/classes/:classId/students', addStudentToClass);
  return app;
};

beforeEach(async () => {
  await Promise.all([
    Student.deleteMany({}),
    StudentClass.deleteMany({}),
    ClassModel.deleteMany({}),
    ClassAge.deleteMany({}),
    School.deleteMany({}),
    User.deleteMany({}),
    Teacher.deleteMany({})
  ]);
});

// Tests ----------------------------------------------------
describe('POST /classes/:classId/students - addStudentToClass (controller)', () => {
  it('ASCID01: Admin adds existing student to class', async () => {
    const school = await createTestSchool('ASC School 1');
    const admin = await createUserWithRole('admin', { username: 'adminASC1' });
    const cls = await createTestClass(school._id);
    const student = await createStudent(school._id, { full_name: 'Stu1' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .post(`/classes/${cls._id}/students`)
      .send({ student_id: student._id.toString() })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Thêm học sinh');
    const link = await StudentClass.findOne({ student_id: student._id, class_id: cls._id });
    expect(link).not.toBeNull();
  });

  it('ASCID02: Invalid class ID returns 400', async () => {
    const admin = await createUserWithRole('admin', { username: 'adminASC2' });
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    await request(app)
      .post('/classes/invalid-id/students')
      .send({ student_id: new mongoose.Types.ObjectId().toString() })
      .expect(400);
  });

  it('ASCID03: Class not found returns 404', async () => {
    const admin = await createUserWithRole('admin', { username: 'adminASC3' });
    const fakeClassId = new mongoose.Types.ObjectId();
    const fakeStudentId = new mongoose.Types.ObjectId();
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    await request(app)
      .post(`/classes/${fakeClassId}/students`)
      .send({ student_id: fakeStudentId.toString() })
      .expect(404);
  });

  it('ASCID04: Student from other school returns 400', async () => {
    const school1 = await createTestSchool('ASC School 4A');
    const school2 = await createTestSchool('ASC School 4B');
    const admin = await createUserWithRole('admin', { username: 'adminASC4' });
    const cls = await createTestClass(school1._id);
    const studentOther = await createStudent(school2._id, { full_name: 'StuOther' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .post(`/classes/${cls._id}/students`)
      .send({ student_id: studentOther._id.toString() })
      .expect(400);

    expect(res.body.message).toContain('không thuộc trường');
  });

  it('ASCID05: Student already in class returns 400', async () => {
    const school = await createTestSchool('ASC School 5');
    const admin = await createUserWithRole('admin', { username: 'adminASC5' });
    const cls = await createTestClass(school._id);
    const student = await createStudent(school._id, { full_name: 'Stu5' });

    await StudentClass.create({ student_id: student._id, class_id: cls._id });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .post(`/classes/${cls._id}/students`)
      .send({ student_id: student._id.toString() })
      .expect(400);

    expect(res.body.message).toContain('một lớp trong năm học');
  });

  it('ASCID06: School admin cannot add student from other school', async () => {
    const school1 = await createTestSchool('ASC School 6A');
    const school2 = await createTestSchool('ASC School 6B');
    const schoolAdmin = await createUserWithRole('school_admin', { username: 'saASC6', school_id: school1._id });
    const classOther = await createTestClass(school2._id);
    const student = await createStudent(school1._id, { full_name: 'Stu6' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .post(`/classes/${classOther._id}/students`)
      .send({ student_id: student._id.toString() })
      .expect(403);

    expect(res.body.message).toContain('trường khác');
  });
});
