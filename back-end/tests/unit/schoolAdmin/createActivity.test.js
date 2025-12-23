const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { createActivity } = require('../../../src/controllers/schoolAdminCalendarController');
const { Activity, User, School } = require('../../../src/models');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/activities', createActivity);
  return app;
}

async function createTestSchool(data = {}) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await School.create({
    school_name: data.school_name || `School ${suffix}`,
    address: data.address || '123 Test St',
    phone: data.phone || `09${suffix.slice(-8)}`,
    email: data.email || `school${suffix}@test.com`,
    logo_url: data.logo_url || 'https://example.com/logo.png',
    status: data.status !== undefined ? data.status : 1
  });
}

async function createSchoolAdmin(school_id = null) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await User.create({
    full_name: 'School Admin',
    username: `admin_${suffix}`,
    password_hash: 'hashed',
    role: 'school_admin',
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id
  });
}

async function createTeacherUser(school_id = null) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await User.create({
    full_name: 'Teacher User',
    username: `teacher_${suffix}`,
    password_hash: 'hashed',
    role: 'teacher',
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id
  });
}

describe('POST /school-admin/calendar/activities - Create Activity', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      Activity.deleteMany({}),
      User.deleteMany({}),
      School.deleteMany({})
    ]);
  });

  // CA01: Create activity successfully (indoor activity)
  it('[CA01] Create activity successfully (indoor activity)', async () => {
    console.log('[CA01] Testing: Create activity successfully (indoor activity)');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Mathematics', description: 'Advanced Math Class', requireOutdoor: 0 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Đã tạo hoạt động mới');
    expect(res.body.data).toBeDefined();
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.name).toBe('Mathematics');
    expect(res.body.data.description).toBe('Advanced Math Class');
    expect(res.body.data.requireOutdoor).toBe(0);

    const saved = await Activity.findById(res.body.data._id);
    expect(saved).toBeDefined();
    expect(saved.school_id.toString()).toBe(school._id.toString());
    expect(saved.activity_name).toBe('Mathematics');
    expect(saved.require_outdoor).toBe(0);
  });

  // CA02: Create activity with outdoor activity flag (requireOutdoor=1)
  it('[CA02] Create activity with outdoor activity flag', async () => {
    console.log('[CA02] Testing: Create activity with outdoor activity flag');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Physical Education', description: 'PE Class - Outdoor', requireOutdoor: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requireOutdoor).toBe(1);

    const saved = await Activity.findById(res.body.data._id);
    expect(saved.require_outdoor).toBe(1);
  });

  // CA03: Missing name field returns 400
  it('[CA03] Missing name field returns 400 error', async () => {
    console.log('[CA03] Testing: Missing name field');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ description: 'Test Description' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Vui lòng cung cấp tên và mô tả hoạt động');
  });

  // CA04: Missing description field returns 400
  it('[CA04] Missing description field returns 400 error', async () => {
    console.log('[CA04] Testing: Missing description field');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Test Activity' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Vui lòng cung cấp tên và mô tả hoạt động');
  });

  // CA05: Both name and description missing returns 400
  it('[CA05] Both name and description missing returns 400 error', async () => {
    console.log('[CA05] Testing: Both name and description missing');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ requireOutdoor: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Vui lòng cung cấp tên và mô tả hoạt động');
  });

  // CA06: Non-school_admin role (teacher) returns 403
  it('[CA06] Non-school_admin role returns 403 forbidden', async () => {
    console.log('[CA06] Testing: Non-school_admin role (teacher) forbidden');
    const school = await createTestSchool();
    const teacher = await createTeacherUser(school._id);
    const app = buildApp({ id: teacher._id.toString(), role: 'teacher' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Test Activity', description: 'Test Description' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Chỉ school_admin mới có quyền tạo activity');
  });

  // CA07: Create activity with special characters in name
  it('[CA07] Create activity with special characters in name', async () => {
    console.log('[CA07] Testing: Create activity with special characters');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Math & Science (A+)', description: 'Combined Math & Science - Level 1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Math & Science (A+)');

    const saved = await Activity.findById(res.body.data._id);
    expect(saved.activity_name).toBe('Math & Science (A+)');
  });

  // CA08: Create activity with long description
  it('[CA08] Create activity with long description', async () => {
    console.log('[CA08] Testing: Create activity with long description');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const longDescription = 'This is a comprehensive description of the Mathematics class. ' +
      'Students will learn advanced topics including algebra, geometry, and calculus. ' +
      'The class includes hands-on practice and problem-solving exercises. ' +
      'Expected duration: 1 hour per session.';

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Advanced Mathematics', description: longDescription });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe(longDescription);

    const saved = await Activity.findById(res.body.data._id);
    expect(saved.description).toBe(longDescription);
  });

  // CA09: Whitespace trimming (leading/trailing spaces)
  it('[CA09] Whitespace trimming in name and description', async () => {
    console.log('[CA09] Testing: Whitespace trimming');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: '  English Class  ', description: '  Learn English Language Skills  ' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('English Class');
    expect(res.body.data.description).toBe('Learn English Language Skills');

    const saved = await Activity.findById(res.body.data._id);
    expect(saved.activity_name).toBe('English Class');
    expect(saved.description).toBe('Learn English Language Skills');
  });

  // CA10: requireOutdoor defaults to 0 when not provided
  it('[CA10] requireOutdoor defaults to 0 when not provided', async () => {
    console.log('[CA10] Testing: requireOutdoor defaults to 0');
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/activities')
      .send({ name: 'Art Class', description: 'Creative Art Activities' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requireOutdoor).toBe(0);

    const saved = await Activity.findById(res.body.data._id);
    expect(saved.require_outdoor).toBe(0);
  });
});
