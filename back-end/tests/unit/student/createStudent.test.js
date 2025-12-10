/**
 * Unit tests for createStudent controller
 * Focus on required fields, school/class validation, and school_admin scoping.
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
const Parent = require('../../../src/models/Parent');
const ParentStudent = require('../../../src/models/ParentStudent');
const { createStudent } = require('../../../src/controllers/studentController');

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
    full_name: 'Teacher User',
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

const createTestClass = async (school_id) => {
  const { teacher } = await createTeacherUserAndProfile(school_id);
  const classAge = await ClassAge.create({ age: 5, age_name: '5', school_id });
  const start_date = new Date('2024-09-01');
  const end_date = new Date('2025-05-31');
  return ClassModel.create({
    class_name: 'Class A',
    academic_year: '2024-2025',
    school_id,
    class_age_id: classAge._id,
    teacher_id: teacher._id,
    start_date,
    end_date
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/students', createStudent);
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
    Teacher.deleteMany({}),
    Parent.deleteMany({}),
    ParentStudent.deleteMany({}),
  ]);
});

// Tests ----------------------------------------------------
describe('POST /students - createStudent (controller)', () => {
  it('CSID01: Admin creates student successfully', async () => {
    const school = await createTestSchool('CS School 1');
    const admin = await User.create({ full_name: 'Admin', username: 'adminCS1', password_hash: 'hash', avatar_url: 'https://via.placeholder.com/150', role: 'admin' });
    const cls = await createTestClass(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .post('/students')
      .send({
        full_name: 'Student One',
        date_of_birth: '2015-01-01',
        gender: 0,
        class_id: cls._id.toString(),
        school_id: school._id.toString()
      })
      .expect(201);

    expect(res.body.message).toContain('Tạo học sinh thành công');
    const student = await Student.findOne({ full_name: 'Student One' });
    expect(student).not.toBeNull();
    const link = await StudentClass.findOne({ student_id: student._id, class_id: cls._id });
    expect(link).not.toBeNull();
  });

  it('CSID02: Missing required fields returns 400', async () => {
    const school = await createTestSchool('CS School 2');
    const admin = await User.create({ full_name: 'Admin', username: 'adminCS2', password_hash: 'hash', avatar_url: 'https://via.placeholder.com/150', role: 'admin' });
    const cls = await createTestClass(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    await request(app)
      .post('/students')
      .send({
        date_of_birth: '2015-01-01',
        gender: 0,
        class_id: cls._id.toString(),
        school_id: school._id.toString()
      })
      .expect(400);
  });

  it('CSID03: School admin without school_id returns 400', async () => {
    const schoolAdmin = await User.create({ full_name: 'SA', username: 'sa_no_school', password_hash: 'hash', avatar_url: 'https://via.placeholder.com/150', role: 'school_admin', school_id: null });
    const school = await createTestSchool('CS School 3');
    const cls = await createTestClass(school._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .post('/students')
      .send({
        full_name: 'Student Three',
        date_of_birth: '2015-02-02',
        gender: 1,
        class_id: cls._id.toString(),
        school_id: school._id.toString()
      })
      .expect(400);

    expect(res.body.message).toContain('School admin');
  });

  it('CSID04: School admin cannot add student to class of another school', async () => {
    const school1 = await createTestSchool('CS School 4A');
    const school2 = await createTestSchool('CS School 4B');
    const schoolAdmin = await User.create({ full_name: 'SA', username: 'sa_school1', password_hash: 'hash', avatar_url: 'https://via.placeholder.com/150', role: 'school_admin', school_id: school1._id });
    const classOther = await createTestClass(school2._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .post('/students')
      .send({
        full_name: 'Student Four',
        date_of_birth: '2015-03-03',
        gender: 0,
        class_id: classOther._id.toString(),
        school_id: school2._id.toString()
      })
      .expect(400);

    expect(res.body.message).toContain('Lớp học không thuộc trường của bạn');
  });
});
