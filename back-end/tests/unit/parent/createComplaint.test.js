/**
 * Unit tests for parent/complaintController.createComplaint
 * POST /api/parent/complaints
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Complaint = require('../../../src/models/Complaint');
const ComplaintType = require('../../../src/models/ComplaintType');
const { createComplaint } = require('../../../src/controllers/parent/complaintController');

// Mock Cloudinary
jest.mock('../../../src/utils/cloudinary', () => ({
  uploader: {
    upload: jest.fn((image, opts) => {
      if (image.includes('UPLOAD_ERROR')) {
        return Promise.reject(new Error('Cloudinary error'));
      }
      return Promise.resolve({
        secure_url: 'https://cloudinary.example.com/image.jpg'
      });
    })
  }
}));

// Helpers --------------------------------------------------
const createSchool = async (name = 'School') => {
  const uniq = Math.random().toString(16).slice(2) + Date.now();
  return School.create({
    school_name: `${name}-${uniq}`,
    address: '123 Test St',
    logo_url: 'https://example.com/logo.png',
    phone: `09${uniq.slice(0, 10)}`,
    email: `school_${uniq}@test.com`
  });
};

const createUser = async (role, school_id = null) => {
  const uniq = Math.random().toString(16).slice(2) + Date.now();
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${uniq}`,
    password_hash: 'hashed',
    email: `${role}_${uniq}@test.com`,
    phone_number: `09${uniq.slice(0, 8)}`,
    avatar_url: 'https://example.com/avatar.png',
    role,
    school_id,
    status: 1
  });
};

const createComplaintType = async (school_id, category = ['parent']) => {
  const uniq = Math.random().toString(16).slice(2);
  return ComplaintType.create({
    name: `Type-${uniq}`,
    description: 'Test complaint type',
    category,
    school_id
  });
};

const buildApp = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/complaints', createComplaint);
  return app;
};

// Setup ----------------------------------------------------
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    Complaint.deleteMany({}),
    ComplaintType.deleteMany({})
  ]);
});

describe('POST /complaints - createComplaint (Parent)', () => {
  describe('Success cases', () => {
    it('PC01: Creates complaint successfully with valid data', async () => {
      const school = await createSchool('S1');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'Issue with meal quality',
          image: null
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.complaintTypeName).toBe(type.name);
      expect(res.body.data.reason).toBe('Issue with meal quality');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.user_id.full_name).toBe('parent User');
      expect(res.body.message).toContain('Gửi đơn thành công');
    });

    it('PC02: Creates complaint with reason containing whitespace (trimmed)', async () => {
      const school = await createSchool('S2');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: '  leading and trailing spaces  ',
          image: null
        })
        .expect(201);

      expect(res.body.data.reason).toBe('leading and trailing spaces');
    });

    it('PC03: Creates complaint with very long reason', async () => {
      const school = await createSchool('S3');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);
      const longReason = 'x'.repeat(500);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: longReason,
          image: null
        })
        .expect(201);

      expect(res.body.data.reason).toBe(longReason);
    });

    it('PC04: Creates complaint and stores school_id correctly', async () => {
      const school = await createSchool('S4');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'test reason',
          image: null
        })
        .expect(201);

      const complaint = await Complaint.findById(res.body.data._id);
      expect(complaint.school_id.toString()).toBe(school._id.toString());
    });
  });

  describe('Validation errors (400)', () => {
    it('PC05: Missing complaint_type_id returns 400', async () => {
      const school = await createSchool('S5');
      const parent = await createUser('parent', school._id);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          reason: 'Missing type',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng chọn loại đơn');
    });

    it('PC06: Missing reason returns 400', async () => {
      const school = await createSchool('S6');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng nhập lý do hoặc nội dung');
    });

    it('PC07: Empty reason (whitespace only) returns 400', async () => {
      const school = await createSchool('S7');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: '   ',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng nhập lý do hoặc nội dung');
    });

    it('PC08: Parent without school_id returns 400', async () => {
      const parent = await createUser('parent', null);
      const school = await createSchool('S8');
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'has reason',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Không tìm thấy thông tin trường học');
    });
  });

  describe('Authorization/Not found errors (403, 404)', () => {
    it('PC09: Complaint type from another school returns 404', async () => {
      const schoolA = await createSchool('SA');
      const schoolB = await createSchool('SB');
      const parentA = await createUser('parent', schoolA._id);
      const typeB = await createComplaintType(schoolB._id, ['parent']);

      const app = buildApp({ id: parentA._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: typeB._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho phụ huynh');
    });

    it('PC10: Complaint type with teacher category (not parent) returns 404', async () => {
      const school = await createSchool('S10');
      const parent = await createUser('parent', school._id);
      const typeTeacher = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: typeTeacher._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho phụ huynh');
    });

    it('PC11: Non-existent complaint type returns 404', async () => {
      const school = await createSchool('S11');
      const parent = await createUser('parent', school._id);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: '507f1f77bcf86cd799439011',
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho phụ huynh');
    });
  });

  describe('Image upload', () => {
    it('PC12: Creates complaint with image successfully (mocked upload)', async () => {
      const school = await createSchool('S12');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'With image',
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        })
        .expect(201);

      expect(res.body.data.image).toBe('https://cloudinary.example.com/image.jpg');
    });

    it('PC13: Image upload failure returns 500', async () => {
      const school = await createSchool('S13');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'With bad image',
          image: 'UPLOAD_ERROR_base64'
        })
        .expect(500);

      expect(res.body.message).toContain('Có lỗi xảy ra khi upload ảnh');
    });

    it('PC14: Complaint with null image is allowed', async () => {
      const school = await createSchool('S14');
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: parent._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'No image',
          image: null
        })
        .expect(201);

      expect(res.body.data.image).toBeNull();
    });
  });
});
