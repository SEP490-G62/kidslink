const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { Class: ClassModel, School, User, Teacher, ClassAge, StudentClass, Student } = require('../../../src/models');
const { getClassStudents } = require('../../../src/controllers/teacherController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/teacher/class-students', getClassStudents);
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

async function createStudent(school_id, data = {}) {
  const suffix = `${Date.now()}${Math.random()}`;
  return await Student.create({
    full_name: data.full_name || `Student ${suffix}`,
    gender: data.gender !== undefined ? data.gender : 0,
    dob: data.dob || new Date('2020-01-01'),
    avatar_url: data.avatar_url || 'https://example.com/avatar.png',
    status: data.status !== undefined ? data.status : 1,
    allergy: data.allergy || null,
    school_id: school_id
  });
}

describe('Teacher Controller - getClassStudents', () => {
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

  it('[CS01] Teacher lấy danh sách học sinh của lớp với class_id', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const student1 = await createStudent(school._id, { full_name: 'Nguyễn Văn A' });
    const student2 = await createStudent(school._id, { full_name: 'Trần Thị B', gender: 1 });
    await StudentClass.create({ student_id: student1._id, class_id: cls._id, academic_year: '2024-2025' });
    await StudentClass.create({ student_id: student2._id, class_id: cls._id, academic_year: '2024-2025', discount: 10 });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.class_id).toBe(cls._id.toString());
    expect(res.body.count).toBe(2);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.students[0].full_name).toBe('Nguyễn Văn A');
    expect(res.body.students[1].full_name).toBe('Trần Thị B');
    expect(res.body.students[1].discount).toBe(10);
    expect(res.body.class_info.class_name).toBe('Lớp A1');
    console.log('\n[CS01] count:', res.body.count, 'students:', res.body.students.map(s => s.full_name).join(', '));
  });

  it('[CS02] Không truyền class_id, lấy lớp mới nhất của teacher', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);

    // Tạo 2 lớp khác năm học
    const cls2023 = await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp 2023',
      academic_year: '2023-2024'
    });
    const cls2024 = await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp 2024',
      academic_year: '2024-2025'
    });

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls2024._id, academic_year: '2024-2025' });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students'); // Không truyền class_id

    expect(res.status).toBe(200);
    expect(res.body.class_id).toBe(cls2024._id.toString()); // Lớp năm mới nhất
    expect(res.body.class_info.class_name).toBe('Lớp 2024');
    expect(res.body.count).toBe(1);
    console.log('\n[CS02] latest class:', res.body.class_info.class_name, 'year:', res.body.class_info.academic_year);
  });

  it('[CS03] Teacher không tồn tại trả 404', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    const app = buildAppWithUser({ id: fakeUserId.toString(), role: 'teacher' });

    const res = await request(app).get('/teacher/class-students');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Không tìm thấy giáo viên');
    console.log('\n[CS03] status:', res.status, 'error:', res.body.error);
  });

  it('[CS04] Teacher chưa có lớp nào trả 404', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students'); // Không truyền class_id

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Giáo viên chưa có lớp học');
    console.log('\n[CS04] status:', res.status, 'error:', res.body.error);
  });

  it('[CS05] Teacher không có quyền truy cập lớp của teacher khác', async () => {
    const school = await createTestSchool();
    const { user: user1, teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher2._id); // Lớp của teacher2

    const app = buildAppWithUser({ id: user1._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Không có quyền truy cập lớp này');
    console.log('\n[CS05] status:', res.status, 'error:', res.body.error);
  });

  it('[CS06] class_id không hợp lệ, fallback lấy lớp mới nhất', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: 'invalid-id' });

    expect(res.status).toBe(200);
    expect(res.body.class_id).toBe(cls._id.toString());
    expect(res.body.count).toBe(1);
    console.log('\n[CS06] fallback to latest class:', res.body.class_info.class_name);
  });

  it('[CS07] Lớp không có học sinh trả về count 0', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.students).toHaveLength(0);
    console.log('\n[CS07] empty class, count:', res.body.count);
  });

  it('[CS08] Teacher là giáo viên phụ (teacher_id2) có quyền xem', async () => {
    const school = await createTestSchool();
    const { user: user1, teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { user: user2, teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher1._id, { teacher_id2: teacher2._id });

    const student = await createStudent(school._id);
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const app = buildAppWithUser({ id: user2._id.toString(), role: 'teacher' }); // Teacher2 login
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    console.log('\n[CS08] teacher2 (assistant) can access, count:', res.body.count);
  });

  it('[CS09] Student info bao gồm allergy và gender', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const student = await createStudent(school._id, {
      full_name: 'Test Student',
      gender: 1,
      allergy: 'Peanuts, Milk'
    });
    await StudentClass.create({ student_id: student._id, class_id: cls._id, academic_year: '2024-2025' });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.students[0].gender).toBe(1);
    expect(res.body.students[0].allergy).toBe('Peanuts, Milk');
    console.log('\n[CS09] student gender:', res.body.students[0].gender, 'allergy:', res.body.students[0].allergy);
  });

  it('[CS10] Class info populate school và class_age', async () => {
    const school = await createTestSchool();
    const { user, teacher } = await createTeacherUserAndProfile(school._id);
    const classAge = await createTestClassAge(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'teacher' });
    const res = await request(app).get('/teacher/class-students').query({ class_id: cls._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.class_info.school).toBeTruthy();
    expect(res.body.class_info.school.school_name).toBeTruthy();
    expect(res.body.class_info.class_age).toBeTruthy();
    expect(res.body.class_info.class_age.age_name).toBe('3-4 tuổi');
    console.log('\n[CS10] school:', res.body.class_info.school.school_name, 'age:', res.body.class_info.class_age.age_name);
  });
});
