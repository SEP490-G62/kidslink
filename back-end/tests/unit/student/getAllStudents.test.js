const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const Parent = require('../../../src/models/Parent');
const ParentStudent = require('../../../src/models/ParentStudent');
const ParentUser = require('../../../src/models/User');
const StudentClass = require('../../../src/models/StudentClass');
const ClassModel = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Teacher = require('../../../src/models/Teacher');
const School = require('../../../src/models/School');
const { getAllStudents } = require('../../../src/controllers/studentController');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/students', getAllStudents);
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
  return ParentUser.create({
    full_name: `${role} User`,
    username: `${role}_${suffix}`,
    password_hash: 'hash',
    role,
    school_id,
    avatar_url: 'https://example.com/avatar.png',
    status: 1
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

const createClass = async (school_id) => {
  const classAge = await createClassAge(school_id);
  const { teacher } = await createTeacherUserAndProfile(school_id);
  return ClassModel.create({
    class_name: 'Lớp A1',
    school_id,
    class_age_id: classAge._id,
    teacher_id: teacher._id,
    academic_year: '2024-2025',
    start_date: '2024-09-01',
    end_date: '2025-06-30'
  });
};

const createStudentWithParentAndClass = async ({
  school,
  full_name = 'Student 1',
  gender = 0
}) => {
  const student = await Student.create({
    full_name,
    gender,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id: school._id
  });

  const parentUser = await createUserWithRole(null, 'parent');
  const parent = await Parent.create({ user_id: parentUser._id });
  await ParentStudent.create({ parent_id: parent._id, student_id: student._id, relationship: 'Bố' });

  const cls = await createClass(school._id);
  await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

  return { student, parentUser, parent, cls };
};

describe('studentController - getAllStudents', () => {
  beforeEach(async () => {
    await Promise.all([
      Student.deleteMany({}),
      Parent.deleteMany({}),
      ParentStudent.deleteMany({}),
      ParentUser.deleteMany({}),
      StudentClass.deleteMany({}),
      ClassModel.deleteMany({}),
      ClassAge.deleteMany({}),
      Teacher.deleteMany({}),
      School.deleteMany({}),
    ]);
  });

  it('[GA01] Admin lấy danh sách học sinh kèm phụ huynh và lớp', async () => {
    const school = await createTestSchool();
    const { student, parentUser, cls } = await createStudentWithParentAndClass({ school, gender: 1 });
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get('/students');

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    const returned = res.body.students[0];
    expect(returned._id.toString()).toBe(student._id.toString());
    expect(returned.gender).toBe('female');
    expect(returned.parents).toHaveLength(1);
    expect(returned.parents[0].relationship).toBe('Bố');
    expect(returned.parents[0].user_id._id.toString()).toBe(parentUser._id.toString());
    expect(returned.class_id._id.toString()).toBe(cls._id.toString());
  });

  it('[GA02] School_admin chỉ thấy học sinh thuộc trường mình', async () => {
    const school1 = await createTestSchool('School1');
    const school2 = await createTestSchool('School2');
    await createStudentWithParentAndClass({ school: school1, full_name: 'Student S1' });
    await createStudentWithParentAndClass({ school: school2, full_name: 'Student S2' });
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get('/students');

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].full_name).toBe('Student S1');
  });

  it('[GA03] school_id không hợp lệ trả 400', async () => {
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get('/students').query({ school_id: 'invalid-id' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('school_id không hợp lệ');
  });

  it('[GA04] School_admin chưa được gán trường trả 400', async () => {
    const schoolAdmin = await createUserWithRole(null, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get('/students');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
  });
});
