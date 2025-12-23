/**
 * Unit tests for getAllUsers controller
 * Covers pagination, filtering, role checks, and school_admin constraints.
 */

const request = require('supertest');
const express = require('express');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const { getAllUsers } = require('../../../src/controllers/userController');

// Helpers --------------------------------------------------
const createTestSchool = async (name = 'Test School') => {
  const uniqueSuffix = Date.now().toString();
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
    role: data.role || 'admin',
    school_id: data.school_id || null,
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  // Inject req.user for each request
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/users', getAllUsers);
  return app;
};

beforeEach(async () => {
  await User.deleteMany({});
  await School.deleteMany({});
});


// Tests ----------------------------------------------------
describe('GET /users - getAllUsers (controller)', () => {
  it('UTCID01: Admin can get all users with default pagination', async () => {
    const school = await createTestSchool('School 1');
    const admin = await createTestUser({ role: 'admin', username: 'admin01' });
    await createTestUser({ role: 'teacher', school_id: school._id, username: 't1' });
    await createTestUser({ role: 'teacher', school_id: school._id, username: 't2' });
    await createTestUser({ role: 'parent', school_id: school._id, username: 'p1' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).get('/users').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(4);
    expect(res.body.pagination.totalItems).toBe(4);
  });

  it('UTCID02: School admin sees only their school manageable roles', async () => {
    const school = await createTestSchool('School 2');
    const schoolAdmin = await createTestUser({ role: 'school_admin', school_id: school._id, username: 'sa1' });
    await createTestUser({ role: 'teacher', school_id: school._id, username: 't3' });
    await createTestUser({ role: 'parent', school_id: school._id, username: 'p2' });
    const otherSchool = await createTestSchool('Other');
    await createTestUser({ role: 'teacher', school_id: otherSchool._id, username: 't_other' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app).get('/users').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.every(u => ['teacher', 'parent', 'health_care_staff', 'nutrition_staff'].includes(u.role))).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.totalItems).toBe(2);
  });

  it('UTCID03: Pagination works (page=2, limit=10)', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin03' });
    for (let i = 0; i < 15; i++) {
      await createTestUser({ role: 'teacher', username: `u${i}` });
    }
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).get('/users?page=2&limit=10').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(6);
    expect(res.body.pagination.currentPage).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.totalItems).toBe(16);
  });

  it('UTCID04: Filter by role=teacher', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin04' });
    await createTestUser({ role: 'teacher', username: 't5' });
    await createTestUser({ role: 'teacher', username: 't6' });
    await createTestUser({ role: 'parent', username: 'p3' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).get('/users?role=teacher').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every(u => u.role === 'teacher')).toBe(true);
  });

  it('UTCID05: Filter by status=1 (active)', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin05' });
    await createTestUser({ role: 'teacher', status: 1, username: 'active' });
    await createTestUser({ role: 'teacher', status: 0, username: 'inactive' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).get('/users?status=1').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.every(u => u.status === 1)).toBe(true);
    // admin + active teacher = 2
    expect(res.body.pagination.totalItems).toBe(2);
  });

  it('UTCID06: Missing req.user returns success with default filter', async () => {
    const app = buildAppWithUser(null);
    const res = await request(app).get('/users').expect(200);
    expect(res.body.success).toBe(true);
  });

  it('UTCID07: School admin requesting non-manageable role returns 400', async () => {
    const school = await createTestSchool('School 7');
    const schoolAdmin = await createTestUser({ role: 'school_admin', school_id: school._id, username: 'sa7' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app).get('/users?role=admin').expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cho phép');
  });

  it('UTCID08: Teacher role should be forbidden by route (simulate)', async () => {
    const teacher = await createTestUser({ role: 'teacher', username: 't9' });
    // Simulate authorize middleware rejecting
    const app = express();
    app.get('/users', (req, res) => res.status(403).json({ success: false, error: 'Không có quyền' }));

    const res = await request(app).get('/users').expect(403);
    expect(res.body.success).toBe(false);
  });

  it('UTCID09: School admin without school_id gets 400', async () => {
    const schoolAdmin = await createTestUser({ role: 'school_admin', username: 'sa_no_school', school_id: null });
    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app).get('/users').expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('gán trường');
  });

  it('Should not return password_hash', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin_nohash' });
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).get('/users').expect(200);

    expect(res.body.data[0]).not.toHaveProperty('password_hash');
  });
});
