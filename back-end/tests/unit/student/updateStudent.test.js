/**
 * Unit tests for updateStudent controller
 * Focus on validation, permission checks, and class transfer logic.
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
const { updateStudent } = require('../../../src/controllers/studentController');

// Helper functions
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

const createUserWithRole = async (school_id, role) => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${uniqueSuffix}`,
    password_hash: 'hash',
    avatar_url: 'https://via.placeholder.com/150',
    role,
    school_id,
    status: 1
  });
};

const createTeacherUserAndProfile = async (school_id) => {
  const user = await createUserWithRole(school_id, 'teacher');
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Math',
    experience_years: 3,
    note: 'Homeroom'
  });
  return { user, teacher };
};

const createTestClass = async (school_id, academic_year = '2024-2025') => {
  const { teacher } = await createTeacherUserAndProfile(school_id);
  const classAge = await ClassAge.create({ 
    age: 5, 
    age_name: '5', 
    school_id 
  });
  const start_date = new Date('2024-09-01');
  const end_date = new Date('2025-05-31');
  return ClassModel.create({
    class_name: `Class ${Date.now()}`,
    academic_year,
    school_id,
    class_age_id: classAge._id,
    teacher_id: teacher._id,
    start_date,
    end_date
  });
};

const createTestStudent = async (school_id, data = {}) => {
  return Student.create({
    full_name: data.full_name || 'Test Student',
    dob: data.dob || new Date('2019-01-01'),
    gender: data.gender !== undefined ? data.gender : 0,
    allergy: data.allergy || 'None',
    avatar_url: data.avatar_url || 'https://via.placeholder.com/150',
    school_id,
    status: data.status !== undefined ? data.status : 1
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.put('/students/:id', updateStudent);
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

describe('PUT /students/:id - updateStudent', () => {
  // USID01: Admin cập nhật thông tin học sinh thành công
  it('[USID01] Admin updates student info successfully', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({
        full_name: 'Updated Name',
        gender: 'female'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    expect(res.body.student.full_name).toBe('Updated Name');
    expect(res.body.student.gender).toBe(1);
    console.log('\n[USID01] message:', res.body.message, 'name:', res.body.student.full_name);
  });

  // USID02: School_admin cập nhật học sinh thành công
  it('[USID02] School_admin updates student successfully', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
    const student = await createTestStudent(school._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({
        full_name: 'New Name',
        date_of_birth: '2019-06-15'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    expect(res.body.student.full_name).toBe('New Name');
    console.log('\n[USID02] message:', res.body.message);
  });

  // USID03: ID không hợp lệ
  it('[USID03] Invalid student ID returns 400', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put('/students/invalid-id')
      .send({ full_name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('student_id không hợp lệ');
    console.log('\n[USID03] status:', res.status, 'message:', res.body.message);
  });

  // USID04: Học sinh không tồn tại
  it('[USID04] Student not found returns 404', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const fakeId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${fakeId}`)
      .send({ full_name: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy học sinh');
    console.log('\n[USID04] status:', res.status, 'message:', res.body.message);
  });

  // USID05: School_admin không có quyền sửa học sinh thuộc trường khác
  it('[USID05] School_admin cannot update student from different school', async () => {
    const school1 = await createTestSchool('School 1');
    const school2 = await createTestSchool('School 2');
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const student = await createTestStudent(school2._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ full_name: 'Test' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Bạn không có quyền chỉnh sửa học sinh thuộc trường khác');
    console.log('\n[USID05] status:', res.status, 'message:', res.body.message);
  });

  // USID06: Cập nhật class_id - chuyển lớp sang năm học khác (cho phép)
  it('[USID06] Update class_id to different academic year successfully', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);
    const class1 = await createTestClass(school._id, '2024-2025');
    const class2 = await createTestClass(school._id, '2025-2026');
    
    // Học sinh ban đầu thuộc class1 (năm 2024-2025)
    await StudentClass.create({
      student_id: student._id,
      class_id: class1._id
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ class_id: class2._id });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    
    // Verify StudentClass updated
    const updatedSC = await StudentClass.findOne({ student_id: student._id });
    expect(updatedSC.class_id.toString()).toBe(class2._id.toString());
    console.log('\n[USID06] message:', res.body.message, 'transferred to year 2025-2026');
  });

  // USID07: Lớp không tồn tại khi cập nhật class_id
  it('[USID07] Class not found when updating class_id', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);
    const fakeClassId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ class_id: fakeClassId });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy lớp học');
    console.log('\n[USID07] status:', res.status, 'message:', res.body.message);
  });

  // USID08: Không thể chuyển học sinh sang lớp thuộc trường khác
  it('[USID08] Cannot transfer student to class of different school', async () => {
    const school1 = await createTestSchool('School 1');
    const school2 = await createTestSchool('School 2');
    const admin = await createUserWithRole(school1._id, 'admin');
    const student = await createTestStudent(school1._id);
    const classSchool2 = await createTestClass(school2._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ class_id: classSchool2._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Không thể chuyển học sinh sang lớp thuộc trường khác');
    console.log('\n[USID08] status:', res.status, 'message:', res.body.message);
  });

  // USID09: Học sinh đã có trong lớp khác cùng năm học
  it('[USID09] Student already in another class in same academic year', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);
    const class1 = await createTestClass(school._id, '2024-2025');
    const class2 = await createTestClass(school._id, '2024-2025');
    
    // Học sinh đã thuộc class1
    await StudentClass.create({
      student_id: student._id,
      class_id: class1._id
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ class_id: class2._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Học sinh đã có trong lớp khác trong năm học 2024-2025');
    console.log('\n[USID09] status:', res.status, 'message:', res.body.message);
  });

  // USID10: Cập nhật status thành công
  it('[USID10] Update status successfully', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id, { status: 1 });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ status: 0 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    expect(res.body.student.status).toBe(0);
    console.log('\n[USID10] message:', res.body.message, 'status:', res.body.student.status);
  });

  // USID11: Cập nhật nhiều fields cùng lúc
  it('[USID11] Update multiple fields successfully', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({
        full_name: 'Multi Update',
        gender: 'female',
        medical_condition: 'Peanut allergy',
        status: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    expect(res.body.student.full_name).toBe('Multi Update');
    expect(res.body.student.gender).toBe(1);
    expect(res.body.student.allergy).toBe('Peanut allergy');
    console.log('\n[USID11] message:', res.body.message, 'fields updated:', res.body.student.full_name);
  });

  // USID12: Cập nhật status và full_name cùng lúc
  it('[USID12] Update multiple fields without class change', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const student = await createTestStudent(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .put(`/students/${student._id}`)
      .send({ 
        full_name: 'Final Update',
        status: 0
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật thành công');
    expect(res.body.student.full_name).toBe('Final Update');
    expect(res.body.student.status).toBe(0);
    console.log('\n[USID12] message:', res.body.message, 'name:', res.body.student.full_name);
  });
});
