const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { Class: ClassModel, School, User, Teacher, ClassAge } = require('../../../src/models');
const { getTeacherClasses } = require('../../../src/controllers/teacherController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/teacher/classes', getTeacherClasses);
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
    avatar_url: 'https://example.com/avatar.png',
    status: 1
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

describe('Teacher Controller - getTeacherClasses', () => {
  beforeEach(async () => {
    await Promise.all([
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({})
    ]);
  });

  it('[TC01] Teacher lấy danh sách lớp mình chủ nhiệm (teacher_id)', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    await createTestClass(school._id, classAge._id, teacher._id, { 
      class_name: 'Lớp A1',
      academic_year: '2024-2025' 
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.teacher_id.toString()).toBe(teacher._id.toString());
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].academic_year).toBe('2024-2025');
    expect(res.body.data[0].classes).toHaveLength(1);
    expect(res.body.data[0].classes[0].class_name).toBe('Lớp A1');
    console.log('\n[TC01] teacher classes:', res.body.data[0].classes.length, 'class:', res.body.data[0].classes[0].class_name);
  });

  it('[TC02] Teacher lấy lớp khi là giáo viên phụ (teacher_id2)', async () => {
    const school = await createTestSchool();
    const { user: user1, teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { user: user2, teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    await createTestClass(school._id, classAge._id, teacher1._id, {
      class_name: 'Lớp B1',
      teacher_id2: teacher2._id,
      academic_year: '2024-2025'
    });

    const app = buildAppWithUser({ id: user2._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.teacher_id.toString()).toBe(teacher2._id.toString());
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].classes).toHaveLength(1);
    expect(res.body.data[0].classes[0].class_name).toBe('Lớp B1');
    console.log('\n[TC02] teacher as assistant:', res.body.data[0].classes[0].class_name);
  });

  it('[TC03] Grouped by academic_year, sorted desc', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Class 2024',
      academic_year: '2024-2025'
    });
    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Class 2023',
      academic_year: '2023-2024'
    });
    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Class 2025',
      academic_year: '2025-2026'
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].academic_year).toBe('2025-2026'); // Latest first
    expect(res.body.data[1].academic_year).toBe('2024-2025');
    expect(res.body.data[2].academic_year).toBe('2023-2024');
    console.log('\n[TC03] years sorted:', res.body.data.map(d => d.academic_year).join(', '));
  });

  it('[TC04] Multiple classes in same academic_year, sorted by class_name', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp C1',
      academic_year: '2024-2025'
    });
    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp A1',
      academic_year: '2024-2025'
    });
    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp B1',
      academic_year: '2024-2025'
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].classes).toHaveLength(3);
    expect(res.body.data[0].classes[0].class_name).toBe('Lớp A1'); // Sorted alphabetically
    expect(res.body.data[0].classes[1].class_name).toBe('Lớp B1');
    expect(res.body.data[0].classes[2].class_name).toBe('Lớp C1');
    console.log('\n[TC04] classes sorted:', res.body.data[0].classes.map(c => c.class_name).join(', '));
  });

  it('[TC05] Teacher không tồn tại trả 404', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    const app = buildAppWithUser({ id: fakeUserId.toString(), role: 'teacher' });

    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy giáo viên');
    console.log('\n[TC05] status:', res.status, 'error:', res.body.error);
  });

  it('[TC06] Teacher chưa có lớp nào trả về array rỗng', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.teacher_id.toString()).toBe(teacher._id.toString());
    expect(res.body.data).toHaveLength(0);
    console.log('\n[TC06] teacher with no classes, data length:', res.body.data.length);
  });

  it('[TC07] Populate school_id và class_age_id', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    const cls = res.body.data[0].classes[0];
    expect(cls.school_id).toBeTruthy();
    expect(cls.school_id.school_name).toBeTruthy();
    expect(cls.class_age_id).toBeTruthy();
    expect(cls.class_age_id.age_name).toBe('3-4 tuổi');
    console.log('\n[TC07] populated school:', cls.school_id.school_name, 'age:', cls.class_age_id.age_name);
  });

  it('[TC08] Teacher vừa là chủ nhiệm vừa là phụ của các lớp khác', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    // Teacher là chủ nhiệm của A1
    await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp A1',
      academic_year: '2024-2025'
    });

    // Teacher là phụ của B1
    await createTestClass(school._id, classAge._id, teacher2._id, {
      class_name: 'Lớp B1',
      teacher_id2: teacher._id,
      academic_year: '2024-2025'
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/classes');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].classes).toHaveLength(2);
    const classNames = res.body.data[0].classes.map(c => c.class_name).sort();
    expect(classNames).toEqual(['Lớp A1', 'Lớp B1']);
    console.log('\n[TC08] teacher in both roles:', classNames.join(', '));
  });
});
