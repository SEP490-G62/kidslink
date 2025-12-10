/**
 * Unit tests for deleteStudent controller (soft delete student)
 * Covers role access (school_admin scoping), invalid IDs, and soft delete status.
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../../../src/models/Student');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const { deleteStudent } = require('../../../src/controllers/studentController');

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

const createUserWithRole = async (role, data = {}) => {
  return User.create({
    full_name: data.full_name || 'User',
    username: data.username || `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: 'hash',
    avatar_url: 'https://via.placeholder.com/150',
    role,
    school_id: data.school_id || null,
    status: 1
  });
};

const createStudent = async (school_id, overrides = {}) => {
  return Student.create({
    full_name: overrides.full_name || 'Student',
    dob: overrides.dob || new Date('2015-01-01'),
    gender: overrides.gender !== undefined ? overrides.gender : 0,
    avatar_url: overrides.avatar_url || 'https://via.placeholder.com/150',
    status: overrides.status !== undefined ? overrides.status : 1,
    school_id
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.delete('/students/:id', deleteStudent);
  return app;
};

beforeEach(async () => {
  await Promise.all([
    Student.deleteMany({}),
    School.deleteMany({}),
    User.deleteMany({})
  ]);
});

// Tests ----------------------------------------------------
describe('DELETE /students/:id - deleteStudent (controller)', () => {
  it('DSID01: Admin soft deletes student (status=0)', async () => {
    const school = await createTestSchool('DS School 1');
    const admin = await createUserWithRole('admin', { username: 'adminDS1' });
    const student = await createStudent(school._id, { full_name: 'Stu1' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).delete(`/students/${student._id}`).expect(200);

    expect(res.body.message).toContain('Vô hiệu hóa');
    const updated = await Student.findById(student._id);
    expect(updated.status).toBe(0);
  });

  it('DSID02: Invalid ObjectId returns 400', async () => {
    const admin = await createUserWithRole('admin', { username: 'adminDS2' });
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    await request(app).delete('/students/invalid-id').expect(400);
  });

  it('DSID03: Not found returns 404', async () => {
    const admin = await createUserWithRole('admin', { username: 'adminDS3' });
    const fakeId = new mongoose.Types.ObjectId();
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    await request(app).delete(`/students/${fakeId}`).expect(404);
  });

  it('DSID04: School admin cannot delete student from other school (403)', async () => {
    const school1 = await createTestSchool('DS School 4A');
    const school2 = await createTestSchool('DS School 4B');
    const schoolAdmin = await createUserWithRole('school_admin', { username: 'saDS4', school_id: school1._id });
    const studentOther = await createStudent(school2._id, { full_name: 'StuOther' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app).delete(`/students/${studentOther._id}`).expect(403);

    expect(res.body.message).toContain('trường khác');
    const still = await Student.findById(studentOther._id);
    expect(still.status).toBe(1);
  });

  it('DSID05: School admin without school_id returns 400', async () => {
    const schoolAdmin = await createUserWithRole('school_admin', { username: 'saNoSchool', school_id: null });
    const school = await createTestSchool('DS School 5');
    const student = await createStudent(school._id, { full_name: 'Stu5' });

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    const res = await request(app).delete(`/students/${student._id}`).expect(400);

    expect(res.body.message).toContain('gán trường');
  });
});
