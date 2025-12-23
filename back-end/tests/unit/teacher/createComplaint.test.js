/**
 * Unit tests for teacher/complaintController.createComplaint
 * POST /api/teachers/complaints
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Complaint = require('../../../src/models/Complaint');
const ComplaintType = require('../../../src/models/ComplaintType');
const { createComplaint } = require('../../../src/controllers/teacher/complaintController');

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

const createComplaintType = async (school_id, category = ['teacher']) => {
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

describe('POST /complaints - createComplaint (Teacher)', () => {
  describe('Success cases', () => {
    it('TC01: Creates complaint successfully with valid data', async () => {
      const school = await createSchool('S1');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'Issue with scheduling',
          image: null
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.complaintTypeName).toBe(type.name);
      expect(res.body.data.reason).toBe('Issue with scheduling');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.user_id.full_name).toBe('teacher User');
      expect(res.body.message).toContain('Gửi đơn thành công');
    });

    it('TC02: Creates complaint with reason trimmed of whitespace', async () => {
      const school = await createSchool('S2');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: '\t\n  spaces  \n\t',
          image: null
        })
        .expect(201);

      expect(res.body.data.reason).toBe('spaces');
    });

    it('TC03: Creates complaint with both teacher and parent categories allowed', async () => {
      const school = await createSchool('S3');
      const teacher = await createUser('teacher', school._id);
      const typeBoth = await createComplaintType(school._id, ['teacher', 'parent']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: typeBoth._id.toString(),
          reason: 'complaint',
          image: null
        })
        .expect(201);

      expect(res.body.data.complaintTypeName).toBe(typeBoth.name);
    });

    it('TC04: Stores school_id from user context', async () => {
      const school = await createSchool('S4');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(201);

      const complaint = await Complaint.findById(res.body.data._id);
      expect(complaint.school_id.toString()).toBe(school._id.toString());
      expect(complaint.user_id.toString()).toBe(teacher._id.toString());
    });
  });

  describe('Validation errors (400)', () => {
    it('TC05: Missing complaint_type_id returns 400', async () => {
      const school = await createSchool('S5');
      const teacher = await createUser('teacher', school._id);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          reason: 'Missing type',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng chọn loại đơn');
    });

    it('TC06: Missing reason returns 400', async () => {
      const school = await createSchool('S6');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng nhập lý do hoặc nội dung');
    });

    it('TC07: Empty reason (blank string) returns 400', async () => {
      const school = await createSchool('S7');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: '',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Vui lòng nhập lý do hoặc nội dung');
    });

    it('TC08: Teacher without school_id returns 400', async () => {
      const teacher = await createUser('teacher', null);
      const school = await createSchool('S8');
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'test reason',
          image: null
        })
        .expect(400);

      expect(res.body.message).toContain('Không tìm thấy thông tin trường học');
    });
  });

  describe('Authorization/Not found errors (404)', () => {
    it('TC09: Complaint type from another school returns 404', async () => {
      const schoolA = await createSchool('SA');
      const schoolB = await createSchool('SB');
      const teacherA = await createUser('teacher', schoolA._id);
      const typeB = await createComplaintType(schoolB._id, ['teacher']);

      const app = buildApp({ id: teacherA._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: typeB._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho giáo viên');
    });

    it('TC10: Complaint type with parent category (not teacher) returns 404', async () => {
      const school = await createSchool('S10');
      const teacher = await createUser('teacher', school._id);
      const typeParent = await createComplaintType(school._id, ['parent']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: typeParent._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho giáo viên');
    });

    it('TC11: Non-existent complaint type returns 404', async () => {
      const school = await createSchool('S11');
      const teacher = await createUser('teacher', school._id);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: '507f1f77bcf86cd799439011',
          reason: 'test',
          image: null
        })
        .expect(404);

      expect(res.body.message).toContain('Loại đơn không tồn tại hoặc không dành cho giáo viên');
    });
  });

  describe('Image upload', () => {
    it('TC12: Creates complaint with image (mocked upload)', async () => {
      const school = await createSchool('S12');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'With image',
          image: 'data:image/png;base64,iVBORw0KGgoAAAA...'
        })
        .expect(201);

      expect(res.body.data.image).toBe('https://cloudinary.example.com/image.jpg');
    });

    it('TC13: Image upload error returns 500', async () => {
      const school = await createSchool('S13');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'With bad image',
          image: 'UPLOAD_ERROR_corrupted'
        })
        .expect(500);

      expect(res.body.message).toContain('Có lỗi xảy ra khi upload ảnh');
    });

    it('TC14: Complaint without image (undefined) is allowed', async () => {
      const school = await createSchool('S14');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'No image field'
        })
        .expect(201);

      expect(res.body.data.image).toBeNull();
    });
  });

  describe('Response structure', () => {
    it('TC15: Response excludes complaint_type_id (select("-complaint_type_id"))', async () => {
      const school = await createSchool('S15');
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);

      const app = buildApp({ id: teacher._id.toString() });
      const res = await request(app)
        .post('/complaints')
        .send({
          complaint_type_id: type._id.toString(),
          reason: 'test',
          image: null
        })
        .expect(201);

      expect(res.body.data.complaint_type_id).toBeUndefined();
      expect(res.body.data.complaintTypeName).toBe(type.name);
      expect(res.body.data.user_id._id).toBeDefined();
    });
  });
});
