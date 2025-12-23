/**
 * Unit tests for createSchool controller
 * Tests school creation with validation, duplicate checks, and admin account generation
 * Route: POST /api/admin/schools
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const { createSchool } = require('../../../src/controllers/adminSchoolController');

// Mock sendMail to prevent actual email sending
jest.mock('../../../src/utils/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(true)
}));

// Mock cloudinary to prevent actual uploads
jest.mock('../../../src/utils/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://cloudinary.com/uploaded-logo.png'
    })
  }
}));

// ========== Helper Functions ==========
const createTestSchool = async (data = {}) => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return School.create({
    school_name: data.school_name || 'Test School',
    address: data.address || '123 Test Street',
    logo_url: data.logo_url || 'https://example.com/logo.png',
    phone: data.phone || `0123456${uniqueSuffix}`,
    email: data.email || `school${uniqueSuffix}@example.com`,
    status: data.status !== undefined ? data.status : 1
  });
};

const createAdminUser = async () => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return User.create({
    full_name: 'Admin User',
    username: `admin_${uniqueSuffix}`,
    password_hash: 'hashed_password',
    email: `admin_${uniqueSuffix}@test.com`,
    phone_number: `091234${uniqueSuffix}`,
    avatar_url: 'https://via.placeholder.com/150',
    role: 'admin',
    school_id: null,
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
  app.post('/schools', createSchool);
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
describe('POST /schools - createSchool', () => {

  // ========== Normal Cases ==========
  
  it('CS01: Admin successfully creates school with required fields only', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'New Test School',
      address: '456 New Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Tạo trường học thành công');
    expect(res.body.data.school.school_name).toBe(schoolData.school_name);
    expect(res.body.data.school.address).toBe(schoolData.address);
    expect(res.body.data.school.status).toBe(1);
    expect(res.body.data.school_admin).toBeDefined();
    expect(res.body.data.school_admin.username).toBeDefined();

    // Verify school admin was created
    const schoolAdmin = await User.findById(res.body.data.school_admin._id);
    expect(schoolAdmin).toBeDefined();
    expect(schoolAdmin.role).toBe('school_admin');
    expect(schoolAdmin.school_id.toString()).toBe(res.body.data.school._id.toString());
  });

  it('CS02: Admin successfully creates school with all fields', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'Complete School',
      address: '789 Complete Street',
      phone: '0987654321',
      email: 'complete@school.com',
      logo_url: 'https://example.com/complete-logo.png',
      payos_config: {
        client_id: 'client123',
        api_key: 'apikey123',
        checksum_key: 'checksum123',
        account_number: '1234567890',
        account_name: 'Test Account',
        bank_code: 'VCB',
        active: true,
        webhook_url: 'https://webhook.example.com'
      }
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.school_name).toBe(schoolData.school_name);
    expect(res.body.data.school.phone).toBe(schoolData.phone);
    expect(res.body.data.school.email).toBe(schoolData.email);
    expect(res.body.data.school.payos_config.client_id).toBe(schoolData.payos_config.client_id);
    expect(res.body.data.school.payos_config.active).toBe(true);
  });

  it('CS03: School admin account has correct default values', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'School For Admin Check',
      address: '123 Admin Street',
      email: 'admin@schoolcheck.com',
      phone: '0123456789'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    const schoolAdmin = await User.findById(res.body.data.school_admin._id);
    
    expect(schoolAdmin.role).toBe('school_admin');
    expect(schoolAdmin.status).toBe(1);
    expect(schoolAdmin.full_name).toContain(schoolData.school_name);
    expect(schoolAdmin.email).toBe(schoolData.email);
    expect(schoolAdmin.phone_number).toBe(schoolData.phone);
    expect(schoolAdmin.address).toBe(schoolData.address);
    expect(schoolAdmin.password_hash).toBeDefined();
    
    // Verify password hash is valid
    const isValidHash = schoolAdmin.password_hash.startsWith('$2');
    expect(isValidHash).toBe(true);
  });

  it('CS04: Creates school with default logo when logo_url not provided', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'School Without Logo',
      address: '123 No Logo Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.logo_url).toBe('https://via.placeholder.com/200');
  });

  it('CS05: Creates school with payos_config active as string "true"', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'PayOS Active String School',
      address: '123 PayOS Street',
      payos_config: {
        client_id: 'client456',
        active: 'true'
      }
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.payos_config.active).toBe(true);
    expect(typeof res.body.data.school.payos_config.active).toBe('boolean');
  });

  // ========== Abnormal Cases ==========

  it('CS06: Missing school_name returns 400', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      address: '123 No Name Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tên trường học và địa chỉ là bắt buộc');
  });

  it('CS07: Missing address returns 400', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'School Without Address'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tên trường học và địa chỉ là bắt buộc');
  });

  it('CS08: Duplicate phone number returns 400', async () => {
    const existingSchool = await createTestSchool({ phone: '0123456789' });
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'Duplicate Phone School',
      address: '123 Duplicate Street',
      phone: '0123456789'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Số điện thoại đã tồn tại');
  });

  it('CS09: Duplicate email returns 400', async () => {
    const existingSchool = await createTestSchool({ email: 'existing@school.com' });
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'Duplicate Email School',
      address: '123 Duplicate Email Street',
      email: 'existing@school.com'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email đã tồn tại');
  });

  it('CS10: Empty school_name returns 400', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: '',
      address: '123 Empty Name Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tên trường học và địa chỉ là bắt buộc');
  });

  it('CS11: Empty address returns 400', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const schoolData = {
      school_name: 'School With Empty Address',
      address: ''
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tên trường học và địa chỉ là bắt buộc');
  });

  // ========== Boundary Cases ==========

  it('CS12: Creates school with very long school_name', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const longName = 'A'.repeat(500);

    const schoolData = {
      school_name: longName,
      address: '123 Long Name Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.school_name).toBe(longName);
  });

  it('CS13: Creates school with special characters in name', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const specialName = 'Trường Tiểu Học Nguyễn Huệ @#$%';

    const schoolData = {
      school_name: specialName,
      address: '123 Special Street'
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.school_name).toBe(specialName);
    
    // Username should be normalized without special chars
    expect(res.body.data.school_admin.username).toBeDefined();
    expect(res.body.data.school_admin.username).not.toContain('@');
    expect(res.body.data.school_admin.username).not.toContain('#');
  });

  it('CS14: Creates unique username when school names collide', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    // Create first school with name "ABC School"
    const res1 = await request(app)
      .post('/schools')
      .send({
        school_name: 'ABC School',
        address: '123 ABC Street',
        phone: '0111111111',
        email: 'abc1@school.com'
      })
      .expect(201);

    // Create second school with same name
    const res2 = await request(app)
      .post('/schools')
      .send({
        school_name: 'ABC School',
        address: '456 ABC Avenue',
        phone: '0222222222',
        email: 'abc2@school.com'
      })
      .expect(201);

    expect(res1.body.data.school_admin.username).toBeDefined();
    expect(res2.body.data.school_admin.username).toBeDefined();
    expect(res1.body.data.school_admin.username).not.toBe(res2.body.data.school_admin.username);
  });

  it('CS15: Creates school without optional email (but with phone to avoid unique constraint)', async () => {
    const admin = await createAdminUser();

    const app = buildAppWithUser({
      id: admin._id.toString(),
      role: 'admin'
    });

    const uniqueSuffix = Date.now().toString();
    const schoolData = {
      school_name: 'Minimal School',
      address: '123 Minimal Street',
      phone: `098765${uniqueSuffix}`
    };

    const res = await request(app)
      .post('/schools')
      .send(schoolData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.school.school_name).toBe(schoolData.school_name);
    expect(res.body.data.school.phone).toBe(schoolData.phone);
    expect(res.body.data.school.email).toBeUndefined();
    
    // School admin should still be created
    expect(res.body.data.school_admin).toBeDefined();
  });
});
