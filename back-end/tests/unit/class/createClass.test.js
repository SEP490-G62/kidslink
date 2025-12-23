const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { Class: ClassModel, School, User, Teacher, ClassAge } = require('../../../src/models');
const { createClass } = require('../../../src/controllers/classController');

// Helper function để tạo Express app với req.user được inject
function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/classes', createClass);
  return app;
}

// Helper functions
async function createTestSchool() {
  return await School.create({
    school_name: 'Test School',
    address: '123 Test St',
    phone_number: '0123456789',
    phone: `phone${Date.now()}${Math.random()}`,
    email: `school${Date.now()}${Math.random()}@test.com`,
    logo_url: 'https://example.com/logo.png'
  });
}

async function createUserWithRole(school_id, role) {
  return await User.create({
    full_name: `Test ${role}`,
    email: `${role}${Date.now()}${Math.random()}@test.com`,
    username: `user${Date.now()}${Math.random()}`,
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

describe('Class Controller - createClass', () => {
  beforeEach(async () => {
    await Promise.all([
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({})
    ]);
  });

  // CC01: Admin tạo lớp thành công
  it('[CC01] Admin tạo lớp thành công', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tạo lớp thành công');
    expect(res.body.data.class_name).toBe('Lớp A1');
    console.log('\n[CC01] message:', res.body.message, 'class_name:', res.body.data.class_name);
  });

  // CC02: School_admin tạo lớp thành công
  it('[CC02] School_admin tạo lớp thành công', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp B1',
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tạo lớp thành công');
    expect(res.body.data.school_id._id.toString()).toBe(school._id.toString());
    console.log('\n[CC02] message:', res.body.message, 'school_id:', res.body.data.school_id._id);
  });

  // CC03: Thiếu class_name
  it('[CC03] Thiếu class_name trả về lỗi', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('class_name là bắt buộc');
    console.log('\n[CC03] status:', res.status, 'message:', res.body.message);
  });

  // CC04: Thiếu class_age_id
  it('[CC04] Thiếu class_age_id trả về lỗi', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('class_age_id là bắt buộc');
    console.log('\n[CC04] status:', res.status, 'message:', res.body.message);
  });

  // CC05: Thiếu teacher_id
  it('[CC05] Thiếu teacher_id trả về lỗi', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        class_age_id: classAge._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('teacher_id là bắt buộc');
    console.log('\n[CC05] status:', res.status, 'message:', res.body.message);
  });

  // CC06: Thiếu academic_year
  it('[CC06] Thiếu academic_year trả về lỗi', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('academic_year là bắt buộc');
    console.log('\n[CC06] status:', res.status, 'message:', res.body.message);
  });

  // CC07: School_admin không có school_id
  it('[CC07] School_admin không có school_id trả về lỗi', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await User.create({
      full_name: 'Test School Admin',
      email: `schooladmin${Date.now()}${Math.random()}@test.com`,
      username: `schooladmin${Date.now()}${Math.random()}`,
      password_hash: 'hashedpassword',
      role: 'school_admin',
      avatar_url: 'https://example.com/avatar.png'
      // Không có school_id
    });
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
    console.log('\n[CC07] status:', res.status, 'message:', res.body.message);
  });

  // CC08: School_admin tạo lớp với giáo viên thuộc trường khác
  it('[CC08] School_admin tạo lớp với giáo viên thuộc trường khác', async () => {
    const school1 = await createTestSchool();
    const school2 = await School.create({
      school_name: 'School 2',
      address: '456 Test St',
      phone_number: '0987654321',
      phone: `phone${Date.now()}${Math.random()}`,
      email: `school2${Date.now()}${Math.random()}@test.com`,
      logo_url: 'https://example.com/logo2.png'
    });
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const classAge = await createTestClassAge(school1._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id); // Giáo viên thuộc school2

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Giáo viên chính không thuộc trường của bạn');
    console.log('\n[CC08] status:', res.status, 'message:', res.body.message);
  });

  // CC09: School_admin tạo lớp với teacher_id2 thuộc trường khác
  it('[CC09] School_admin tạo lớp với teacher_id2 thuộc trường khác', async () => {
    const school1 = await createTestSchool();
    const school2 = await School.create({
      school_name: 'School 2',
      address: '456 Test St',
      phone_number: '0987654321',
      phone: `phone${Date.now()}${Math.random()}`,
      email: `school2${Date.now()}${Math.random()}@test.com`,
      logo_url: 'https://example.com/logo2.png'
    });
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const classAge = await createTestClassAge(school1._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school1._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school2._id); // Teacher2 thuộc school2

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        class_age_id: classAge._id,
        teacher_id: teacher1._id,
        teacher_id2: teacher2._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Giáo viên phụ không thuộc trường của bạn');
    console.log('\n[CC09] status:', res.status, 'message:', res.body.message);
  });

  // CC10: Tạo lớp trùng tên trong cùng năm học
  it('[CC10] Tạo lớp trùng tên trong cùng năm học', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);

    // Tạo lớp đầu tiên
    await ClassModel.create({
      class_name: 'Lớp A1',
      school_id: school._id,
      class_age_id: classAge._id,
      teacher_id: teacher1._id,
      academic_year: '2024-2025',
      start_date: '2024-09-01',
      end_date: '2025-06-30'
    });

    // Tạo lớp trùng tên
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher2._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Đã tồn tại lớp "Lớp A1" trong năm học 2024-2025');
    console.log('\n[CC10] status:', res.status, 'message:', res.body.message);
  });

  // CC11: Giáo viên chính đã có lớp trong năm học
  it('[CC11] Giáo viên chính đã có lớp trong năm học', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    // Tạo lớp đầu tiên với teacher này
    await ClassModel.create({
      class_name: 'Lớp A1',
      school_id: school._id,
      class_age_id: classAge._id,
      teacher_id: teacher._id,
      academic_year: '2024-2025',
      start_date: '2024-09-01',
      end_date: '2025-06-30'
    });

    // Tạo lớp thứ hai với cùng teacher trong cùng năm học
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp B1',
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Giáo viên chính đã có lớp trong năm học 2024-2025');
    console.log('\n[CC11] status:', res.status, 'message:', res.body.message);
  });

  // CC12: Tạo lớp với teacher_id2 thành công
  it('[CC12] Tạo lớp với teacher_id2 thành công', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
    const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/classes')
      .send({
        class_name: 'Lớp A1',
        school_id: school._id,
        class_age_id: classAge._id,
        teacher_id: teacher1._id,
        teacher_id2: teacher2._id,
        academic_year: '2024-2025',
        start_date: '2024-09-01',
        end_date: '2025-06-30'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tạo lớp thành công');
    expect(res.body.data.teacher_id2).toBeDefined();
    console.log('\n[CC12] message:', res.body.message, 'teacher_id2:', res.body.data.teacher_id2._id);
  });
});
