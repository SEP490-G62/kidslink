/**
 * Unit tests for createHealthRecord controller
 * Route: POST /health-staff/health/records
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Student = require('../../../src/models/Student');
const HealthRecord = require('../../../src/models/HealthRecord');
const HealthCareStaff = require('../../../src/models/HealthCareStaff');
const { createHealthRecord } = require('../../../src/controllers/healthCareController');

// Converts Decimal128 or primitive number-like values to float for assertions
const toNumber = (value) => parseFloat(value?.$numberDecimal ?? value);

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
  app.post('/health/records', createHealthRecord);
  return app;
};

// Setup ----------------------------------------------------
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    HealthRecord.deleteMany({}),
    HealthCareStaff.deleteMany({})
  ]);
});

describe('POST /health/records - createHealthRecord', () => {
  // Normal
  it('HR01: Creates health record successfully', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const staff = await createHealthStaff(user._id);
    const student = await createStudent(school._id, 'HS1');

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const payload = {
      student_id: student._id.toString(),
      checkup_date: '2025-01-02',
      height_cm: 110.5,
      weight_kg: 18.2,
      note: 'Khỏe mạnh'
    };

    const res = await request(app)
      .post('/health/records')
      .send(payload)
      .expect(201);

    expect(res.body.message).toContain('Tạo sổ sức khoẻ thành công');
    expect(res.body.record.student_id.toString()).toBe(student._id.toString());
    expect(res.body.record.health_care_staff_id.toString()).toBe(staff._id.toString());
    expect(toNumber(res.body.record.height_cm)).toBeCloseTo(payload.height_cm);
    expect(toNumber(res.body.record.weight_kg)).toBeCloseTo(payload.weight_kg);
  });

  // Abnormal
  it('HR02: Missing required fields returns 400', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({ student_id: student._id.toString(), checkup_date: '2025-01-02' })
      .expect(400);

    expect(res.body.error).toContain('Thiếu trường dữ liệu');
  });

  it('HR03: Invalid student_id format returns 400', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: 'not-objectid',
        checkup_date: '2025-01-02',
        height_cm: 100,
        weight_kg: 15,
        note: 'note'
      })
      .expect(400);

    expect(res.body.error).toContain('student_id không hợp lệ');
  });

  it('HR04: Student not found returns 404', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    await createHealthStaff(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: '507f1f77bcf86cd799439011',
        checkup_date: '2025-01-02',
        height_cm: 100,
        weight_kg: 15,
        note: 'note'
      })
      .expect(404);

    expect(res.body.error).toContain('Không tìm thấy học sinh');
  });

  it('HR05: Student in different school returns 403', async () => {
    const school1 = await createTestSchool('S1');
    const school2 = await createTestSchool('S2');
    const user = await createUserWithRole(school1._id, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(school2._id, 'HS2');

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school1._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: student._id.toString(),
        checkup_date: '2025-01-02',
        height_cm: 100,
        weight_kg: 15,
        note: 'note'
      })
      .expect(403);

    expect(res.body.error).toContain('Không có quyền tạo sổ sức khỏe cho học sinh này');
  });

  it('HR06: Staff record not found returns 403', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: student._id.toString(),
        checkup_date: '2025-01-02',
        height_cm: 100,
        weight_kg: 15,
        note: 'note'
      })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy nhân viên y tế');
  });

  it('HR07: User without school_id returns 403', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(null, 'health_care_staff');
    await createHealthStaff(user._id);
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: null });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: student._id.toString(),
        checkup_date: '2025-01-02',
        height_cm: 100,
        weight_kg: 15,
        note: 'note'
      })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy thông tin trường học');
  });

  // Boundary
  it('HR08: Creates record with decimal height/weight strings', async () => {
    const school = await createTestSchool();
    const user = await createUserWithRole(school._id, 'health_care_staff');
    const staff = await createHealthStaff(user._id);
    const student = await createStudent(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'health_care_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/health/records')
      .send({
        student_id: student._id.toString(),
        checkup_date: '2025-01-03',
        height_cm: '111.7',
        weight_kg: '19.4',
        note: 'ok'
      })
      .expect(201);

    expect(toNumber(res.body.record.height_cm)).toBeCloseTo(111.7);
    expect(toNumber(res.body.record.weight_kg)).toBeCloseTo(19.4);
    expect(res.body.record.health_care_staff_id.toString()).toBe(staff._id.toString());
  });
});
