const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const Parent = require('../../../src/models/Parent');
const ParentStudent = require('../../../src/models/ParentStudent');
const User = require('../../../src/models/User');
const StudentClass = require('../../../src/models/StudentClass');
const ClassModel = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Teacher = require('../../../src/models/Teacher');
const School = require('../../../src/models/School');
const { getStudentsByClass } = require('../../../src/controllers/studentController');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/classes/:classId/students', getStudentsByClass);
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

const createClass = async (school_id, classAge_id, teacher_id) => {
  return ClassModel.create({
    class_name: 'Lớp A1',
    school_id,
    class_age_id: classAge_id,
    teacher_id: teacher_id,
    academic_year: '2024-2025',
    start_date: '2024-09-01',
    end_date: '2025-06-30'
  });
};

const createStudentWithParent = async (school_id) => {
  const student = await Student.create({
    full_name: `Student ${Date.now()}${Math.random()}`,
    gender: 0,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id: school_id
  });

  const parentUser = await createUserWithRole(school_id, 'parent');
  const parent = await Parent.create({ user_id: parentUser._id });
  await ParentStudent.create({
    parent_id: parent._id,
    student_id: student._id,
    relationship: 'Bố'
  });

  return { student, parentUser, parent };
};

describe('studentController - getStudentsByClass', () => {
  beforeEach(async () => {
    await Promise.all([
      Student.deleteMany({}),
      Parent.deleteMany({}),
      ParentStudent.deleteMany({}),
      User.deleteMany({}),
      StudentClass.deleteMany({}),
      ClassModel.deleteMany({}),
      ClassAge.deleteMany({}),
      Teacher.deleteMany({}),
      School.deleteMany({})
    ]);
  });

  it('[GS01] Admin lấy danh sách học sinh của lớp', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const { student: student1 } = await createStudentWithParent(school._id);
    const { student: student2 } = await createStudentWithParent(school._id);
    await StudentClass.create({ student_id: student1._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: student2._id, class_id: cls._id, academic_year: '2024-2025' });

    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.students[0].gender).toBe('male'); // gender converted to string
    expect(res.body.students[0].parents).toHaveLength(1);
    expect(res.body.students[0].parents[0].relationship).toBe('Bố');
    console.log('\n[GS01] students:', res.body.students.length, 'gender:', res.body.students[0].gender);
  });

  it('[GS02] School_admin lấy danh sách học sinh lớp thuộc trường mình', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const { student } = await createStudentWithParent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0]._id.toString()).toBe(student._id.toString());
    console.log('\n[GS02] school_admin can access, students:', res.body.students.length);
  });

  it('[GS03] class_id không hợp lệ trả 400', async () => {
    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get('/classes/invalid-id/students');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('class_id không hợp lệ');
    console.log('\n[GS03] status:', res.status, 'message:', res.body.message);
  });

  it('[GS04] Lớp không tồn tại trả 404', async () => {
    const admin = await createUserWithRole(null, 'admin');
    const fakeId = new mongoose.Types.ObjectId();
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${fakeId}/students`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy lớp học');
    console.log('\n[GS04] status:', res.status, 'message:', res.body.message);
  });

  it('[GS05] School_admin không có quyền xem lớp thuộc trường khác', async () => {
    const school1 = await createTestSchool('School1');
    const school2 = await createTestSchool('School2');
    const classAge = await createClassAge(school2._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id);
    const cls = await createClass(school2._id, classAge._id, teacher._id);

    const { student } = await createStudentWithParent(school2._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Bạn không có quyền xem lớp thuộc trường khác');
    console.log('\n[GS05] status:', res.status, 'message:', res.body.message);
  });

  it('[GS06] School_admin chưa được gán trường trả 400', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const schoolAdmin = await createUserWithRole(null, 'school_admin');
    const app = buildApp({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
    console.log('\n[GS06] status:', res.status, 'message:', res.body.message);
  });

  it('[GS07] Lớp không có học sinh trả về array rỗng', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(0);
    console.log('\n[GS07] empty class, students:', res.body.students.length);
  });

  it('[GS08] Gender được convert: 0 → male, 1 → female', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const studentMale = await Student.create({
      full_name: 'Male Student',
      gender: 0,
      dob: new Date('2020-01-01'),
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      school_id: school._id
    });
    const studentFemale = await Student.create({
      full_name: 'Female Student',
      gender: 1,
      dob: new Date('2020-01-01'),
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      school_id: school._id
    });
    await StudentClass.create({ student_id: studentMale._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: studentFemale._id, class_id: cls._id, academic_year: '2024-2025' });

    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(2);
    const male = res.body.students.find(s => s.full_name === 'Male Student');
    const female = res.body.students.find(s => s.full_name === 'Female Student');
    expect(male.gender).toBe('male');
    expect(female.gender).toBe('female');
    console.log('\n[GS08] male gender:', male.gender, 'female gender:', female.gender);
  });

  it('[GS09] Học sinh có nhiều phụ huynh', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await Student.create({
      full_name: 'Student with 2 parents',
      gender: 0,
      dob: new Date('2020-01-01'),
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      school_id: school._id
    });

    const parentUser1 = await createUserWithRole(school._id, 'parent');
    const parent1 = await Parent.create({ user_id: parentUser1._id });
    await ParentStudent.create({ parent_id: parent1._id, student_id: student._id, relationship: 'Bố' });

    const parentUser2 = await createUserWithRole(school._id, 'parent');
    const parent2 = await Parent.create({ user_id: parentUser2._id });
    await ParentStudent.create({ parent_id: parent2._id, student_id: student._id, relationship: 'Mẹ' });

    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students[0].parents).toHaveLength(2);
    const relationships = res.body.students[0].parents.map(p => p.relationship).sort();
    expect(relationships).toEqual(['Bố', 'Mẹ']);
    console.log('\n[GS09] parents:', res.body.students[0].parents.length, 'relationships:', relationships.join(', '));
  });

  it('[GS10] Học sinh không có phụ huynh vẫn trả về', async () => {
    const school = await createTestSchool();
    const classAge = await createClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createClass(school._id, classAge._id, teacher._id);

    const student = await Student.create({
      full_name: 'Student without parents',
      gender: 1,
      dob: new Date('2020-01-01'),
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      school_id: school._id
    });
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const admin = await createUserWithRole(null, 'admin');
    const app = buildApp({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app).get(`/classes/${cls._id}/students`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].full_name).toBe('Student without parents');
    expect(res.body.students[0].parents).toHaveLength(0);
    console.log('\n[GS10] student without parents, parents:', res.body.students[0].parents.length);
  });
});
