const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const Parent = require('../../../src/models/Parent');
const ParentStudent = require('../../../src/models/ParentStudent');
const User = require('../../../src/models/User');
const Pickup = require('../../../src/models/Pickup');
const PickupStudent = require('../../../src/models/PickupStudent');
const StudentClass = require('../../../src/models/StudentClass');
const ClassModel = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Teacher = require('../../../src/models/Teacher');
const School = require('../../../src/models/School');
const { getStudentDetail } = require('../../../src/controllers/studentController');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/students/:id', getStudentDetail);
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

const createStudentFull = async (school) => {
  const student = await Student.create({
    full_name: 'Nguyễn Văn A',
    gender: 0,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://example.com/student.png',
    allergy: 'Peanuts',
    status: 1,
    school_id: school._id
  });

  // Create parent
  const parentUser = await createUserWithRole(school._id, 'parent');
  const parent = await Parent.create({ user_id: parentUser._id });
  await ParentStudent.create({
    parent_id: parent._id,
    student_id: student._id,
    relationship: 'Bố'
  });

  // Create pickup person
  const pickup = await Pickup.create({
    full_name: 'Nguyễn Thị B',
    relationship: 'Mẹ',
    id_card_number: '123456789',
    avatar_url: 'https://example.com/pickup.png',
    phone: '0987654321'
  });
  await PickupStudent.create({
    pickup_id: pickup._id,
    student_id: student._id
  });

  // Assign to class
  const cls = await createClass(school._id);
  await StudentClass.create({
    student_id: student._id,
    class_id: cls._id,
    academic_year: '2024-2025'
  });

  return { student, parentUser, parent, pickup, cls };
};

describe('studentController - getStudentDetail', () => {
  beforeEach(async () => {
    await Promise.all([
      Student.deleteMany({}),
      Parent.deleteMany({}),
      ParentStudent.deleteMany({}),
      User.deleteMany({}),
      Pickup.deleteMany({}),
      PickupStudent.deleteMany({}),
      StudentClass.deleteMany({}),
      ClassModel.deleteMany({}),
      ClassAge.deleteMany({}),
      Teacher.deleteMany({}),
      School.deleteMany({})
    ]);
  });

  it('[GD01] Admin lấy chi tiết học sinh với phụ huynh, người đón, lớp', async () => {
    const school = await createTestSchool();
    const { student, parentUser, pickup, cls } = await createStudentFull(school);
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/students/${student._id}`);

    expect(res.status).toBe(200);
    expect(res.body.student._id.toString()).toBe(student._id.toString());
    expect(res.body.student.full_name).toBe('Nguyễn Văn A');
    expect(res.body.student.allergy).toBe('Peanuts');
    expect(res.body.parents).toHaveLength(1);
    expect(res.body.parents[0].relationship).toBe('Bố');
    expect(res.body.parents[0].user.user_id.toString()).toBe(parentUser._id.toString());
    expect(res.body.pickups).toHaveLength(1);
    expect(res.body.pickups[0].full_name).toBe('Nguyễn Thị B');
    expect(res.body.pickups[0].relationship).toBe('Mẹ');
    expect(res.body.classes).toHaveLength(1);
    expect(res.body.classes[0]._id.toString()).toBe(cls._id.toString());
    console.log('\n[GD01] student:', res.body.student.full_name, 'parents:', res.body.parents.length, 'pickups:', res.body.pickups.length);
  });

  it('[GD02] student_id không hợp lệ trả 400', async () => {
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get('/students/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('student_id không hợp lệ');
    console.log('\n[GD02] status:', res.status, 'message:', res.body.message);
  });

  it('[GD03] Học sinh không tồn tại trả 404', async () => {
    const admin = await createUserWithRole(null, 'admin');
    const fakeId = new mongoose.Types.ObjectId();
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/students/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy học sinh');
    console.log('\n[GD03] status:', res.status, 'message:', res.body.message);
  });

  it('[GD04] School_admin không có quyền xem học sinh thuộc trường khác', async () => {
    const school1 = await createTestSchool('School1');
    const school2 = await createTestSchool('School2');
    const { student } = await createStudentFull(school2);
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/students/${student._id}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Bạn không có quyền xem học sinh thuộc trường khác');
    console.log('\n[GD04] status:', res.status, 'message:', res.body.message);
  });

  it('[GD05] School_admin xem được học sinh thuộc trường mình', async () => {
    const school = await createTestSchool();
    const { student, parentUser } = await createStudentFull(school);
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/students/${student._id}`);

    expect(res.status).toBe(200);
    expect(res.body.student._id.toString()).toBe(student._id.toString());
    expect(res.body.parents).toHaveLength(1);
    expect(res.body.parents[0].user.user_id.toString()).toBe(parentUser._id.toString());
    console.log('\n[GD05] student:', res.body.student.full_name, 'school_id:', res.body.student.school_id);
  });

  it('[GD06] School_admin chưa được gán trường trả 400', async () => {
    const school = await createTestSchool();
    const { student } = await createStudentFull(school);
    const schoolAdmin = await createUserWithRole(null, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/students/${student._id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
    console.log('\n[GD06] status:', res.status, 'message:', res.body.message);
  });

  it('[GD07] Học sinh không có phụ huynh hoặc người đón vẫn trả 200', async () => {
    const school = await createTestSchool();
    const student = await Student.create({
      full_name: 'Học sinh đơn độc',
      gender: 1,
      dob: new Date('2020-05-05'),
      avatar_url: 'https://example.com/student2.png',
      status: 1,
      school_id: school._id
    });
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/students/${student._id}`);

    expect(res.status).toBe(200);
    expect(res.body.student.full_name).toBe('Học sinh đơn độc');
    expect(res.body.parents).toHaveLength(0);
    expect(res.body.pickups).toHaveLength(0);
    expect(res.body.classes).toHaveLength(0);
    console.log('\n[GD07] student:', res.body.student.full_name, 'parents:', res.body.parents.length);
  });
});
