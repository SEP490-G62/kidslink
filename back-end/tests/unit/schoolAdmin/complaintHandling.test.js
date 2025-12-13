/**
 * Unit tests for schoolAdminComplaintController handlers (handle complaint flows)
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Complaint = require('../../../src/models/Complaint');
const ComplaintType = require('../../../src/models/ComplaintType');
const {
  getAllComplaints,
  getComplaintById,
  approveComplaint,
  rejectComplaint,
  getComplaintStats
} = require('../../../src/controllers/schoolAdminComplaintController');

// Helpers --------------------------------------------------
const createSchool = async (name = 'School') => {
  const uniq = Math.random().toString(16).slice(2) + Date.now();
  return School.create({
    school_name: `${name}-${uniq}`,
    address: '123 Any St',
    logo_url: 'https://example.com/logo.png',
    phone: `09${uniq.slice(0, 10)}`,
    email: `${name.toLowerCase()}_${uniq}@school.test`
  });
};

const createUser = async (role, school_id = null) => {
  const uniq = `${Date.now()}${Math.random().toString(16).slice(2)}`;
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
  const uniq = `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return ComplaintType.create({
    name: `Type-${uniq}`,
    description: 'desc',
    category,
    school_id
  });
};

const createComplaint = async (user_id, school_id, complaintType, status = 'pending', reason = 'reason', response = undefined) => {
  return Complaint.create({
    complaint_type_id: complaintType._id,
    school_id,
    complaintTypeName: complaintType.name,
    reason,
    image: null,
    status,
    user_id,
    response
  });
};

const buildApp = (method, path, handler, userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app[method](path, handler);
  return app;
};

// Helper to extract complaint ID from path (convert :id, :complaintId etc to :complaintId for consistency)
const normalizeRoute = (path) => {
  if (path.includes(':')) {
    return path.replace(/:[a-zA-Z0-9]+/, ':complaintId');
  }
  return path;
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

describe('School admin handle complaints', () => {
  describe('getAllComplaints', () => {
    it('returns complaints of the same school and supports status filter', async () => {
      const schoolA = await createSchool('A');
      const schoolB = await createSchool('B');
      const admin = await createUser('school_admin', schoolA._id);
      const teacherA = await createUser('teacher', schoolA._id);
      const parentA = await createUser('parent', schoolA._id);
      const teacherB = await createUser('teacher', schoolB._id);

      const typeA = await createComplaintType(schoolA._id, ['teacher', 'parent']);
      const typeB = await createComplaintType(schoolB._id, ['teacher']);

      await createComplaint(teacherA._id, schoolA._id, typeA, 'pending', 'teacher complaint');
      await createComplaint(parentA._id, schoolA._id, typeA, 'approve', 'parent complaint');
      await createComplaint(teacherB._id, schoolB._id, typeB, 'pending', 'other school');

      const app = buildApp('get', '/complaints', getAllComplaints, { id: admin._id.toString() });

      const resAll = await request(app).get('/complaints').expect(200);
      expect(resAll.body.success).toBe(true);
      expect(resAll.body.data).toHaveLength(2);
      expect(resAll.body.data.map((c) => c.status).sort()).toEqual(['approve', 'pending']);

      const resPending = await request(app).get('/complaints').query({ status: 'pending' }).expect(200);
      expect(resPending.body.data).toHaveLength(1);
      expect(resPending.body.data[0].status).toBe('pending');
      expect(resPending.body.data[0].user_id.role).toBe('teacher');
    });

    it('returns 400 when admin missing school_id', async () => {
      const admin = await createUser('school_admin', null);
      const app = buildApp('get', '/complaints', getAllComplaints, { id: admin._id.toString() });

      const res = await request(app).get('/complaints').expect(400);
      expect(res.body.message).toContain('Không tìm thấy thông tin trường học');
    });
  });

  describe('getComplaintById', () => {
    it('returns complaint when owner is in same school', async () => {
      const school = await createSchool('C');
      const admin = await createUser('school_admin', school._id);
      const teacher = await createUser('teacher', school._id);
      const type = await createComplaintType(school._id, ['teacher']);
      const complaint = await createComplaint(teacher._id, school._id, type, 'pending');

      const app = buildApp('get', '/complaints/:complaintId', getComplaintById, { id: admin._id.toString() });
      const res = await request(app).get(`/complaints/${complaint._id}`).expect(200);
      expect(res.body.data._id.toString()).toBe(complaint._id.toString());
      expect(res.body.data.user_id._id.toString()).toBe(teacher._id.toString());
    });

    it('returns 403 when complaint belongs to another school', async () => {
      const schoolA = await createSchool('A');
      const schoolB = await createSchool('B');
      const admin = await createUser('school_admin', schoolA._id);
      const teacherB = await createUser('teacher', schoolB._id);
      const typeB = await createComplaintType(schoolB._id, ['teacher']);
      const complaintB = await createComplaint(teacherB._id, schoolB._id, typeB, 'pending');

      const app = buildApp('get', '/complaints/:complaintId', getComplaintById, { id: admin._id.toString() });
      const res = await request(app).get(`/complaints/${complaintB._id}`).expect(403);
      expect(res.body.message).toContain('Bạn không có quyền xem đơn này');
    });

    it('returns 404 when complaint not found', async () => {
      const school = await createSchool('D');
      const admin = await createUser('school_admin', school._id);
      const app = buildApp('get', '/complaints/:complaintId', getComplaintById, { id: admin._id.toString() });

      const res = await request(app).get('/complaints/507f1f77bcf86cd799439011').expect(404);
      expect(res.body.message).toContain('Không tìm thấy đơn');
    });
  });

  describe('approveComplaint', () => {
    it('approves complaint with trimmed response', async () => {
      const school = await createSchool('E');
      const admin = await createUser('school_admin', school._id);
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);
      const complaint = await createComplaint(parent._id, school._id, type, 'pending');

      const app = buildApp('put', '/complaints/:complaintId/approve', approveComplaint, { id: admin._id.toString() });
      const res = await request(app)
        .put(`/complaints/${complaint._id}/approve`)
        .send({ response: '  noted ' })
        .expect(200);

      expect(res.body.data.status).toBe('approve');
      expect(res.body.data.response).toBe('noted');
      expect(res.body.message).toContain('Duyệt đơn thành công');
    });

    it('returns 403 when complaint is from another school', async () => {
      const schoolA = await createSchool('A');
      const schoolB = await createSchool('B');
      const admin = await createUser('school_admin', schoolA._id);
      const teacherB = await createUser('teacher', schoolB._id);
      const typeB = await createComplaintType(schoolB._id, ['teacher']);
      const complaintB = await createComplaint(teacherB._id, schoolB._id, typeB, 'pending');

      const app = buildApp('put', '/complaints/:complaintId/approve', approveComplaint, { id: admin._id.toString() });
      const res = await request(app)
        .put(`/complaints/${complaintB._id}/approve`)
        .send({ response: 'ok' })
        .expect(403);

      expect(res.body.message).toContain('Bạn không có quyền xử lý đơn này');
    });

    it('returns 400 when admin missing school_id', async () => {
      const admin = await createUser('school_admin', null);
      const app = buildApp('put', '/complaints/:complaintId/approve', approveComplaint, { id: admin._id.toString() });

      const res = await request(app)
        .put('/complaints/507f1f77bcf86cd799439011/approve')
        .send({ response: 'ok' })
        .expect(400);

      expect(res.body.message).toContain('Không tìm thấy thông tin trường học');
    });
  });

  describe('rejectComplaint', () => {
    it('rejects complaint and clears response when missing', async () => {
      const school = await createSchool('F');
      const admin = await createUser('school_admin', school._id);
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['parent']);
      const complaint = await createComplaint(parent._id, school._id, type, 'pending');

      const app = buildApp('put', '/complaints/:complaintId/reject', rejectComplaint, { id: admin._id.toString() });
      const res = await request(app)
        .put(`/complaints/${complaint._id}/reject`)
        .send({})
        .expect(200);

      expect(res.body.data.status).toBe('reject');
      expect(res.body.data.response).toBe('');
      expect(res.body.message).toContain('Từ chối đơn thành công');
    });

    it('returns 404 when complaint not found', async () => {
      const school = await createSchool('G');
      const admin = await createUser('school_admin', school._id);
      const app = buildApp('put', '/complaints/:complaintId/reject', rejectComplaint, { id: admin._id.toString() });

      const res = await request(app)
        .put('/complaints/507f1f77bcf86cd799439011/reject')
        .send({ response: 'nope' })
        .expect(404);

      expect(res.body.message).toContain('Không tìm thấy đơn');
    });
  });

  describe('getComplaintStats', () => {
    it('returns stats grouped by role and overall', async () => {
      const school = await createSchool('H');
      const admin = await createUser('school_admin', school._id);
      const teacher = await createUser('teacher', school._id);
      const parent = await createUser('parent', school._id);
      const type = await createComplaintType(school._id, ['teacher', 'parent']);

      await createComplaint(teacher._id, school._id, type, 'pending');
      await createComplaint(parent._id, school._id, type, 'approve');

      const app = buildApp('get', '/complaints/stats', getComplaintStats, { id: admin._id.toString() });
      const res = await request(app).get('/complaints/stats').expect(200);

      expect(res.body.data.all.total).toBe(2);
      expect(res.body.data.teacher.pending).toBe(1);
      expect(res.body.data.parent.approved).toBe(1);
    });
  });
});
