/**
 * Unit tests for updateSchoolInfo controller
 * Tests update school information with various scenarios
 * Route: PUT /api/school-admin/school/:schoolId?
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const { updateSchoolInfo } = require('../../../src/controllers/schoolAdminSchoolController');

// ========== Helper Functions ==========
const createTestSchool = async (data = {}) => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return School.create({
    school_name: data.school_name || 'Test School',
    address: data.address || '123 Test Street',
    logo_url: data.logo_url || 'https://example.com/logo.png',
    phone: data.phone || `0123456${uniqueSuffix}`,
    email: data.email || `school${uniqueSuffix}@example.com`,
    qr_data: data.qr_data || null,
    status: data.status !== undefined ? data.status : 1,
    payos_config: data.payos_config || {}
  });
};

const createUserWithRole = async (school_id, role = 'school_admin') => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${uniqueSuffix}`,
    password_hash: 'hashed_password',
    email: `${role}_${uniqueSuffix}@test.com`,
    phone_number: `091234${uniqueSuffix}`,
    avatar_url: 'https://via.placeholder.com/150',
    role: role,
    school_id: school_id,
    status: 1
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.put('/school/:schoolId?', updateSchoolInfo);
  return app;
};

// ========== Setup and Teardown ==========
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({})
  ]);
});

// ========== Test Cases ==========
describe('PUT /school/:schoolId? - updateSchoolInfo', () => {

  // ========== Normal Cases ==========
  
  it('US01: School admin successfully updates school name', async () => {
    const school = await createTestSchool({ school_name: 'Original School' });
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ school_name: 'Updated School Name' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Cập nhật thông tin trường học thành công');
    expect(res.body.data.school_name).toBe('Updated School Name');
  });

  it('US02: School admin successfully updates all fields', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const updateData = {
      school_name: 'Complete Update School',
      address: '456 New Address',
      phone: '0987654321',
      email: 'newschool@example.com',
      status: 1,
      qr_data: 'QR123456'
    };

    const res = await request(app)
      .put('/school')
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school_name).toBe(updateData.school_name);
    expect(res.body.data.address).toBe(updateData.address);
    expect(res.body.data.phone).toBe(updateData.phone);
    expect(res.body.data.email).toBe(updateData.email);
    expect(res.body.data.qr_data).toBe(updateData.qr_data);
  });

  it('US03: Admin successfully updates school by schoolId parameter', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(null, 'admin');

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin',
      school_id: null
    });

    const res = await request(app)
      .put(`/school/${school._id}`)
      .send({ school_name: 'Admin Updated School' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school_name).toBe('Admin Updated School');
  });

  it('US04: School admin updates payos_config', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const payosConfig = {
      client_id: 'client123',
      api_key: 'apikey123',
      checksum_key: 'checksum123',
      account_number: '1234567890',
      account_name: 'Test Account',
      bank_code: 'VCB',
      active: true,
      webhook_url: 'https://webhook.example.com'
    };

    const res = await request(app)
      .put('/school')
      .send({ payos_config: payosConfig })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.payos_config.client_id).toBe(payosConfig.client_id);
    expect(res.body.data.payos_config.active).toBe(true);
  });

  it('US05: School admin updates logo_url with direct URL', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const newLogoUrl = 'https://example.com/new-logo.png';

    const res = await request(app)
      .put('/school')
      .send({ logo_url: newLogoUrl })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.logo_url).toBe(newLogoUrl);
  });

  // ========== Abnormal Cases ==========

  it('US06: Duplicate phone number returns 400', async () => {
    const school1 = await createTestSchool({ phone: '0123456789' });
    const school2 = await createTestSchool({ phone: '0987654321' });
    const schoolAdmin = await createUserWithRole(school2._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school2._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ phone: '0123456789' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Số điện thoại đã tồn tại ở trường khác');
  });

  it('US07: Duplicate email returns 400', async () => {
    const school1 = await createTestSchool({ email: 'existing@example.com' });
    const school2 = await createTestSchool({ email: 'another@example.com' });
    const schoolAdmin = await createUserWithRole(school2._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school2._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ email: 'existing@example.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email đã tồn tại ở trường khác');
  });

  it('US08: Duplicate qr_data returns 400', async () => {
    const school1 = await createTestSchool({ qr_data: 'QR_UNIQUE_123' });
    const school2 = await createTestSchool({ qr_data: 'QR_UNIQUE_456' });
    const schoolAdmin = await createUserWithRole(school2._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school2._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ qr_data: 'QR_UNIQUE_123' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('QR data đã tồn tại ở trường khác');
  });

  it('US09: School admin without school_id returns 400', async () => {
    const schoolAdmin = await createUserWithRole(null, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: null
    });

    const res = await request(app)
      .put('/school')
      .send({ school_name: 'New Name' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tài khoản school admin chưa được gán school_id');
  });

  it('US10: School not found returns 404', async () => {
    const fakeSchoolId = '507f1f77bcf86cd799439011';
    const admin = await createUserWithRole(null, 'admin');

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin',
      school_id: null
    });

    const res = await request(app)
      .put(`/school/${fakeSchoolId}`)
      .send({ school_name: 'Update Non-existent' })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Không tìm thấy thông tin trường học');
  });

  // ========== Boundary Cases ==========

  it('US11: Updating with empty school_name returns validation error', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ school_name: '' })
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Lỗi khi cập nhật thông tin trường học');
  });

  it('US12: Updating with very long school_name', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const longName = 'A'.repeat(500);

    const res = await request(app)
      .put('/school')
      .send({ school_name: longName })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school_name).toBe(longName);
  });

  it('US13: Partial update (only address)', async () => {
    const school = await createTestSchool({
      school_name: 'Original Name',
      address: 'Original Address',
      phone: '0123456789'
    });
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({ address: 'New Address Only' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school_name).toBe('Original Name');
    expect(res.body.data.address).toBe('New Address Only');
    expect(res.body.data.phone).toBe('0123456789');
  });

  it('US14: Update with undefined values (should be ignored)', async () => {
    const school = await createTestSchool({ school_name: 'Original' });
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .put('/school')
      .send({})
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school_name).toBe('Original');
  });

  it('US15: Update payos_config with active as string "true"', async () => {
    const school = await createTestSchool();
    const schoolAdmin = await createUserWithRole(school._id, 'school_admin');

    const app = buildAppWithUser({
      id: schoolAdmin._id.toString(),
      role: 'school_admin',
      school_id: school._id.toString()
    });

    const payosConfig = {
      client_id: 'client456',
      active: 'true'
    };

    const res = await request(app)
      .put('/school')
      .send({ payos_config: payosConfig })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.payos_config.active).toBe(true);
    expect(typeof res.body.data.payos_config.active).toBe('boolean');
  });
});
