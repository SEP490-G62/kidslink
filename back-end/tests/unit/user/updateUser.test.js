/**
 * Unit tests for updateUser controller
 * Covers validations, duplicate constraints, role immutability, and school_admin access rules.
 */

const request = require('supertest');
const express = require('express');
const User = require('../../../src/models/User');
const Teacher = require('../../../src/models/Teacher');
const HealthCareStaff = require('../../../src/models/HealthCareStaff');
const Parent = require('../../../src/models/Parent');
const ParentStudent = require('../../../src/models/ParentStudent');
const Student = require('../../../src/models/Student');
const StudentClass = require('../../../src/models/StudentClass');
const School = require('../../../src/models/School');
const { updateUser } = require('../../../src/controllers/userController');

// Helpers --------------------------------------------------
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

const createTestUser = async (data = {}) => {
  return User.create({
    full_name: data.full_name || 'Test User',
    username: data.username || `test_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: data.password_hash || 'hashed_password',
    email: data.email || `test_${Date.now()}@test.com`,
    phone_number: data.phone_number || '0912345678',
    avatar_url: data.avatar_url || 'https://via.placeholder.com/150',
    role: data.role || 'teacher',
    school_id: data.school_id || null,
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.put('/users/:id', updateUser);
  return app;
};

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Teacher.deleteMany({}),
    HealthCareStaff.deleteMany({}),
    Parent.deleteMany({}),
    ParentStudent.deleteMany({}),
    Student.deleteMany({}),
    StudentClass.deleteMany({}),
    School.deleteMany({})
  ]);
});

// Tests ----------------------------------------------------
describe('PUT /users/:id - updateUser (controller)', () => {
  it('UUID01: Admin updates basic fields of teacher', async () => {
    const school = await createTestSchool('School U1');
    const admin = await createTestUser({ role: 'admin', username: 'adminU1' });
    const teacher = await createTestUser({ role: 'teacher', username: 'tU1', school_id: school._id, email: 'tU1@test.com' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({ full_name: 'Teacher Updated', email: 'newteacher@test.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe('Teacher Updated');
    expect(res.body.data.email).toBe('newteacher@test.com');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it('UUID02: School admin updates teacher in same school', async () => {
    const school = await createTestSchool('School U2');
    const schoolAdmin = await createTestUser({ role: 'school_admin', school_id: school._id, username: 'saU2' });
    const teacher = await createTestUser({ role: 'teacher', school_id: school._id, username: 'tU2' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({ full_name: 'Teacher SA Updated' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe('Teacher SA Updated');
  });

  it('UUID03: School admin cannot update teacher from other school', async () => {
    const school1 = await createTestSchool('School A');
    const school2 = await createTestSchool('School B');
    const schoolAdmin = await createTestUser({ role: 'school_admin', school_id: school1._id, username: 'saU3' });
    const otherTeacher = await createTestUser({ role: 'teacher', school_id: school2._id, username: 'tOtherU3' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .put(`/users/${otherTeacher._id}`)
      .send({ full_name: 'Nope' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('UUID04: Cannot change role', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'adminU4' });
    const teacher = await createTestUser({ role: 'teacher', username: 'tU4' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({ role: 'parent' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('role');
  });

  it('UUID05: Duplicate username returns 400', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'adminU5' });
    const user1 = await createTestUser({ role: 'teacher', username: 'dupUser' });
    const user2 = await createTestUser({ role: 'teacher', username: 'targetU5' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${user2._id}`)
      .send({ username: 'dupUser' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Username');
  });

  it('UUID06: Weak password rejected', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'adminU6' });
    const teacher = await createTestUser({ role: 'teacher', username: 'tU6' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({ password: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Mật khẩu');
  });

  it('UUID07: Not found returns 404', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'adminU7' });
    const fakeId = '507f1f77bcf86cd799439011';

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${fakeId}`)
      .send({ full_name: 'Nothing' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('UUID08: Update teacher profile persists to Teacher collection', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'adminU8' });
    const teacher = await createTestUser({ role: 'teacher', username: 'tU8' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({
        teacher_profile: {
          qualification: 'Master',
          major: 'Physics',
          experience_years: 7,
          note: 'Senior teacher'
        }
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    const profile = await Teacher.findOne({ user_id: teacher._id });
    expect(profile).not.toBeNull();
    expect(profile.major).toBe('Physics');
  });

  it('UUID09: School admin without school_id cannot update', async () => {
    const schoolAdmin = await createTestUser({ role: 'school_admin', school_id: null, username: 'saNoSchool' });
    const teacher = await createTestUser({ role: 'teacher', username: 'tU9', school_id: null });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app)
      .put(`/users/${teacher._id}`)
      .send({ full_name: 'Nope' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('gán trường');
  });
});
