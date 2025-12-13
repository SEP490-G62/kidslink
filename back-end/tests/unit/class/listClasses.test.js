const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { Class: ClassModel, School, User, Teacher, ClassAge } = require('../../../src/models');
const { listClasses } = require('../../../src/controllers/classController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/classes', listClasses);
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

async function createTestClassAge(school_id, age_name = '3-4 tuổi') {
  return await ClassAge.create({
    school_id: school_id,
    age_name: age_name,
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

describe('Class Controller - listClasses', () => {
  beforeEach(async () => {
    await Promise.all([
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({})
    ]);
  });

  it('[LC01] Admin lấy danh sách tất cả lớp học', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    
    await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp A1' });
    await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp B1', academic_year: '2023-2024' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.totalItems).toBe(2);
    // Sorted by academic_year desc, class_name asc
    expect(res.body.data[0].class_name).toBe('Lớp A1'); // 2024-2025 first
    expect(res.body.data[1].class_name).toBe('Lớp B1'); // 2023-2024
    console.log('\n[LC01] total classes:', res.body.data.length, 'first:', res.body.data[0].class_name);
  });

  it('[LC02] School_admin chỉ thấy lớp thuộc trường mình', async () => {
    const school1 = await createTestSchool();
    const school2 = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const classAge1 = await createTestClassAge(school1._id);
    const classAge2 = await createTestClassAge(school2._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school1._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school2._id);

    await createTestClass(school1._id, classAge1._id, teacher1._id, { class_name: 'School1 Class' });
    await createTestClass(school2._id, classAge2._id, teacher2._id, { class_name: 'School2 Class' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app).get('/classes');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('School1 Class');
    console.log('\n[LC02] classes:', res.body.data.length, 'class:', res.body.data[0].class_name);
  });

  it('[LC03] Filter theo school_id', async () => {
    const school1 = await createTestSchool();
    const school2 = await createTestSchool();
    const admin = await createUserWithRole(null, 'admin');
    const classAge1 = await createTestClassAge(school1._id);
    const classAge2 = await createTestClassAge(school2._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school1._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school2._id);

    await createTestClass(school1._id, classAge1._id, teacher1._id, { class_name: 'S1 Class' });
    await createTestClass(school2._id, classAge2._id, teacher2._id, { class_name: 'S2 Class' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ school_id: school1._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('S1 Class');
    console.log('\n[LC03] filtered by school:', res.body.data[0].class_name);
  });

  it('[LC04] Filter theo academic_year', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Class 2024', academic_year: '2024-2025' });
    await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Class 2023', academic_year: '2023-2024' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ academic_year: '2023-2024' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('Class 2023');
    console.log('\n[LC04] filtered by year:', res.body.data[0].academic_year);
  });

  it('[LC05] Filter theo teacher_id (chủ nhiệm chính)', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);

    await createTestClass(school._id, classAge._id, teacher1._id, { class_name: 'T1 Class' });
    await createTestClass(school._id, classAge._id, teacher2._id, { class_name: 'T2 Class' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ teacher_id: teacher1._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('T1 Class');
    console.log('\n[LC05] filtered by teacher:', res.body.data[0].class_name);
  });

  it('[LC06] Filter theo teacher_id2 (giáo viên phụ)', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);

    await createTestClass(school._id, classAge._id, teacher1._id, { 
      class_name: 'Class with T2 as assistant',
      teacher_id2: teacher2._id 
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ teacher_id: teacher2._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('Class with T2 as assistant');
    console.log('\n[LC06] found by teacher_id2:', res.body.data[0].class_name);
  });

  it('[LC07] Filter theo class_age_id', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge1 = await createTestClassAge(school._id, '3-4 tuổi');
    const classAge2 = await createTestClassAge(school._id, '4-5 tuổi');
    const { teacher } = await createTeacherUserAndProfile(school._id);

    await createTestClass(school._id, classAge1._id, teacher._id, { class_name: 'Age 3-4' });
    await createTestClass(school._id, classAge2._id, teacher._id, { class_name: 'Age 4-5' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ class_age_id: classAge1._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].class_name).toBe('Age 3-4');
    console.log('\n[LC07] filtered by class_age:', res.body.data[0].class_name);
  });

  it('[LC08] Pagination hoạt động đúng', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    // Create 5 classes
    for (let i = 1; i <= 5; i++) {
      await createTestClass(school._id, classAge._id, teacher._id, { class_name: `Class ${i}` });
    }

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes').query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.currentPage).toBe(1);
    expect(res.body.pagination.totalItems).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.pagination.itemsPerPage).toBe(2);
    console.log('\n[LC08] page 1, limit 2:', res.body.data.length, 'total:', res.body.pagination.totalItems);
  });

  it('[LC09] School_admin chưa được gán trường trả 400', async () => {
    const schoolAdmin = await createUserWithRole(null, 'school_admin');
    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });

    const res = await request(app).get('/classes');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
    console.log('\n[LC09] status:', res.status, 'message:', res.body.message);
  });

  it('[LC10] Populate đầy đủ thông tin school, class_age, teacher', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app).get('/classes');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    const cls = res.body.data[0];
    expect(cls.school_id).toBeTruthy();
    expect(cls.school_id.school_name).toBeTruthy();
    expect(cls.class_age_id).toBeTruthy();
    expect(cls.class_age_id.age_name).toBe('3-4 tuổi');
    expect(cls.teacher_id).toBeTruthy();
    expect(cls.teacher_id.user_id).toBeTruthy();
    expect(cls.teacher_id.user_id.full_name).toBeTruthy();
    console.log('\n[LC10] populated teacher:', cls.teacher_id.user_id.full_name);
  });
});
