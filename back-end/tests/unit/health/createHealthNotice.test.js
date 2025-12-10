/**
 * Unit tests for createHealthNotice controller
 * Route: POST /health-staff/health/notices
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Student = require('../../../src/models/Student');
const HealthNotice = require('../../../src/models/HealthNotice');
const HealthCareStaff = require('../../../src/models/HealthCareStaff');
const { createHealthNotice } = require('../../../src/controllers/healthCareController');

// Helpers --------------------------------------------------
const createTestSchool = async (name = 'Health School') => {
  const unique = Date.now().toString() + Math.random().toString(16).slice(2);
  return School.create({
    school_name: name,
    address: '123 Health St',
    logo_url: 'https://via.placeholder.com/150',
    phone: `0123456${unique}`,
    email: `school_${unique}@example.com`
  });
};

const createUserWithRole = async (school_id, role = 'health_care_staff') => {
  const unique = Date.now().toString() + Math.random().toString(16).slice(2);
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${unique}`,
    password_hash: 'hashed_password',
    email: `${role}_${unique}@test.com`,
    phone_number: `0912${unique}`,
    avatar_url: 'https://via.placeholder.com/150',
    role,
    school_id,
    status: 1
  });
};

const createHealthStaff = async (user_id) => {
  return HealthCareStaff.create({
    qualification: 'BS',
    major: 'Nhi',
    experience_years: 5,
    note: 'Staff note',
    user_id
  });
};

const createStudent = async (school_id, name = 'Student A') => {
  return Student.create({
    full_name: name,
    school_id,
    dob: new Date('2020-01-01'),
    gender: 0,
    avatar_url: '',
    status: 1,
    allergy: ''
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/health/notices', createHealthNotice);
  return app;
};

// Setup ----------------------------------------------------
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    HealthNotice.deleteMany({}),
    HealthCareStaff.deleteMany({})
  ]);
});

describe('POST /health/notices - createHealthNotice', () => {
  // Normal
  it('HN01: Creates health notice successfully', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const staff = await createHealthStaff(user._id);
    const student = await createStudent(school._id, 'HS1');

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const payload = {
      student_id: student._id.toString(),
      symptoms: 'Sốt cao',
      actions_taken: 'Đo nhiệt độ',
      medications: 'Paracetamol',
      notice_time: '2025-01-02T10:00:00Z',
      note: 'Theo dõi thêm'
    };

    const res = await request(app)
      .post('/health/notices')
      .send(payload)
      .expect(201);

    expect(res.body.message).toContain('Tạo thông báo y tế thành công');
    expect(res.body.notice.student_id.toString()).toBe(student._id.toString());
    expect(res.body.notice.health_care_staff_id.toString()).toBe(staff._id.toString());
  });

  // Abnormal
  it('HN02: Missing required fields returns 400', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/notices')
      .send({ student_id: student._id.toString(), symptoms: 'Sốt' })
      .expect(400);

    expect(res.body.error).toContain('Thiếu trường dữ liệu');
  });

  it('HN03: Invalid student_id format returns 400', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: 'not-objectid',
        symptoms: 'Sốt',
        actions_taken: 'Đo nhiệt độ',
        medications: 'Thuốc',
        notice_time: '2025-01-02T10:00:00Z',
        note: 'Ghi chú'
      })
      .expect(400);

    expect(res.body.error).toContain('student_id không hợp lệ');
  });

  it('HN04: Student not found returns 404', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: '507f1f77bcf86cd799439011',
        symptoms: 'Sốt',
        actions_taken: 'Đo nhiệt độ',
        medications: 'Thuốc',
        notice_time: '2025-01-02T10:00:00Z',
        note: 'Ghi chú'
      })
      .expect(404);

    expect(res.body.error).toContain('Không tìm thấy học sinh');
  });

  it('HN05: Student in different school returns 403', async () => {
    const school1 = await createTestSchool('S1');
    const school2 = await createTestSchool('S2');
    const user = await createUserWithRole(school1._id, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(school2._id, 'HS2');

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school1._id.toString() });

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: student._id.toString(),
        symptoms: 'Sốt',
        actions_taken: 'Đo nhiệt độ',
        medications: 'Thuốc',
        notice_time: '2025-01-02T10:00:00Z',
        note: 'Ghi chú'
      })
      .expect(403);

    expect(res.body.error).toContain('Không có quyền tạo thông báo y tế cho học sinh này');
  });

  it('HN06: Staff record not found returns 403', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: student._id.toString(),
        symptoms: 'Sốt',
        actions_taken: 'Đo nhiệt độ',
        medications: 'Thuốc',
        notice_time: '2025-01-02T10:00:00Z',
        note: 'Ghi chú'
      })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy nhân viên y tế');
  });

  it('HN07: User without school_id returns 403', async () => {
    const user = await createUserWithRole(null, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(null); // student without school will cause 404 later, but school check hits first

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: null });

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: student._id.toString(),
        symptoms: 'Sốt',
        actions_taken: 'Đo nhiệt độ',
        medications: 'Thuốc',
        notice_time: '2025-01-02T10:00:00Z',
        note: 'Ghi chú'
      })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy thông tin trường học');
  });

  // Boundary
  it('HN08: Creates notice with long note and symptoms', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const staff = await createHealthStaff(user._id);
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const longText = 'X'.repeat(500);

    const res = await request(app)
      .post('/health/notices')
      .send({
        student_id: student._id.toString(),
        symptoms: longText,
        actions_taken: 'Theo dõi',
        medications: 'Thuốc',
        notice_time: '2025-01-03T10:00:00Z',
        note: longText
      })
      .expect(201);

    expect(res.body.notice.symptoms).toBe(longText);
    expect(res.body.notice.note).toBe(longText);
    expect(res.body.notice.health_care_staff_id.toString()).toBe(staff._id.toString());
  });
});
