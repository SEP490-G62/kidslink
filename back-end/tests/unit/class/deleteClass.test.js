const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { Class: ClassModel, School, User, Teacher, ClassAge, StudentClass, Student } = require('../../../src/models');
const { deleteClass } = require('../../../src/controllers/classController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.delete('/classes/:id', deleteClass);
  return app;
}

async function createTestSchool() {
  const suffix = `${Date.now()}${Math.random()}`;
  return await School.create({
    school_name: `Test School ${suffix}`,
    address: '123 Test St',
    phone_number: '0123456789',
    phone: `phone${suffix}`,
    email: `school${suffix}@test.com`,
    logo_url: 'https://example.com/logo.png'
  });
}

async function createUserWithRole(school_id, role) {
  const suffix = `${Date.now()}${Math.random()}`;
  return await User.create({
    full_name: `Test ${role}`,
    email: `${role}${suffix}@test.com`,
    username: `user${suffix}`,
    password_hash: 'hashedpassword',
    role: role,
    school_id: school_id,
    avatar_url: 'https://example.com/avatar.png'
  });
}

async function createTeacherUserAndProfile(school_id) {
  const user = await createUserWithRole(school_id, 'teacher');
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Cử nhân',
    major: 'Sư phạm mầm non',
    experience_years: 5,
    note: 'Giáo viên giỏi'
  });
  return { user, teacher };
}

async function createTestClassAge(school_id) {
  return await ClassAge.create({
    school_id: school_id,
    age_name: '3-4 tuổi',
    age: 3
  });
}

async function createTestClass(school_id, class_age_id, teacher_id, data = {}) {
  return await ClassModel.create({
    class_name: data.class_name || 'Lớp A1',
    school_id: school_id,
    class_age_id: class_age_id,
    teacher_id: teacher_id,
    teacher_id2: data.teacher_id2 || null,
    academic_year: data.academic_year || '2024-2025',
    start_date: data.start_date || '2024-09-01',
    end_date: data.end_date || '2025-06-30'
  });
}

async function createStudent(school_id) {
  const suffix = `${Date.now()}${Math.random()}`;
  return await Student.create({
    full_name: `Student ${suffix}`,
    gender: 0,
    dob: new Date('2020-01-01'),
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id: school_id
  });
}

describe('Class Controller - deleteClass', () => {
  beforeEach(async () => {
    await Promise.all([
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({}),
      StudentClass.deleteMany({}),
      Student.deleteMany({})
    ]);
  });

  it('[DC01] Admin xóa lớp thành công', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).delete(`/classes/${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Xóa lớp thành công');

    const deleted = await ClassModel.findById(cls._id);
    expect(deleted).toBeNull();
    console.log('\n[DC01] message:', res.body.message);
  });

  it('[DC02] School_admin xóa lớp thuộc trường mình thành công', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app).delete(`/classes/${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Xóa lớp thành công');

    const deleted = await ClassModel.findById(cls._id);
    expect(deleted).toBeNull();
    console.log('\n[DC02] message:', res.body.message);
  });

  it('[DC03] ID không hợp lệ trả về 400', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).delete('/classes/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('ID không hợp lệ');
    console.log('\n[DC03] status:', res.status, 'message:', res.body.message);
  });

  it('[DC04] Lớp không tồn tại trả về 404', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const fakeId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).delete(`/classes/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy lớp');
    console.log('\n[DC04] status:', res.status, 'message:', res.body.message);
  });

  it('[DC05] School_admin không có quyền xóa lớp thuộc trường khác', async () => {
    const school1 = await createTestSchool();
    const school2 = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const classAge = await createTestClassAge(school2._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id);
    const cls = await createTestClass(school2._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app).delete(`/classes/${cls._id}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bạn không có quyền xóa lớp thuộc trường khác');

    // Lớp vẫn tồn tại
    const stillExists = await ClassModel.findById(cls._id);
    expect(stillExists).toBeTruthy();
    console.log('\n[DC05] status:', res.status, 'message:', res.body.message);
  });

  it('[DC06] School_admin chưa được gán trường trả 400', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(null, 'school_admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app).delete(`/classes/${cls._id}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('School admin chưa được gán trường học');

    // Lớp vẫn tồn tại
    const stillExists = await ClassModel.findById(cls._id);
    expect(stillExists).toBeTruthy();
    console.log('\n[DC06] status:', res.status, 'message:', res.body.message);
  });

  it('[DC07] Xóa lớp cũng xóa tất cả StudentClass liên quan', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    // Tạo học sinh và gán vào lớp
    const student1 = await createStudent(school._id);
    const student2 = await createStudent(school._id);
    await StudentClass.create({ student_id: student1._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: student2._id, class_id: cls._id, academic_year: '2024-2025' });

    const studentClassesBefore = await StudentClass.find({ class_id: cls._id });
    expect(studentClassesBefore).toHaveLength(2);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).delete(`/classes/${cls._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Kiểm tra StudentClass đã bị xóa
    const studentClassesAfter = await StudentClass.find({ class_id: cls._id });
    expect(studentClassesAfter).toHaveLength(0);

    // Học sinh vẫn tồn tại
    const student1Still = await Student.findById(student1._id);
    const student2Still = await Student.findById(student2._id);
    expect(student1Still).toBeTruthy();
    expect(student2Still).toBeTruthy();

    console.log('\n[DC07] StudentClass deleted:', studentClassesBefore.length, '→', studentClassesAfter.length);
  });

  it('[DC08] Xóa lớp không ảnh hưởng đến lớp khác', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    
    const cls1 = await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp A1' });
    const cls2 = await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp B1', academic_year: '2023-2024' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).delete(`/classes/${cls1._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // cls1 bị xóa
    const deleted = await ClassModel.findById(cls1._id);
    expect(deleted).toBeNull();

    // cls2 vẫn tồn tại
    const stillExists = await ClassModel.findById(cls2._id);
    expect(stillExists).toBeTruthy();
    expect(stillExists.class_name).toBe('Lớp B1');

    console.log('\n[DC08] cls1 deleted, cls2 still exists:', stillExists.class_name);
  });
});
