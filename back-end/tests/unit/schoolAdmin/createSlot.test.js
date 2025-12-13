const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { createSlot } = require('../../../src/controllers/slotController');
const { Slot, User, School } = require('../../../src/models');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/slots', createSlot);
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

describe('slotController - createSlot', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      Slot.deleteMany({}),
      User.deleteMany({}),
      School.deleteMany({})
    ]);
  });

  it('[POS01] Tạo slot thành công', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 1', startTime: '07:00', endTime: '08:00' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Đã tạo khung giờ tiết học mới');
    expect(res.body.data.slotName).toBe('Tiết 1');
    expect(res.body.data.startTime).toBe('07:00');
    expect(res.body.data.endTime).toBe('08:00');

    const saved = await Slot.findOne({ slot_name: 'Tiết 1' });
    expect(saved).toBeTruthy();
    expect(saved.school_id.toString()).toBe(school._id.toString());
    console.log('\n[POS01] slot:', saved.slot_name, 'time:', saved.start_time, '-', saved.end_time);
  });

  it('[NEG01] Thiếu startTime hoặc endTime trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 2', startTime: '08:00' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Vui lòng cung cấp giờ bắt đầu và giờ kết thúc');
    console.log('\n[NEG01] status:', res.status, 'message:', res.body.message);
  });

  it('[NEG02] Thiếu slotName trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/slots')
      .send({ startTime: '08:00', endTime: '09:00' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Vui lòng cung cấp tên tiết học');
    console.log('\n[NEG02] status:', res.status, 'message:', res.body.message);
  });

  it('[NEG03] Không phải school_admin trả 403', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'teacher' });

    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 3', startTime: '09:00', endTime: '10:00' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Chỉ school_admin mới có quyền tạo slot');
    console.log('\n[NEG03] status:', res.status, 'message:', res.body.message);
  });

  it('[NEG04] School admin chưa được gán trường', async () => {
    const admin = await createSchoolAdmin(null);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 4', startTime: '10:00', endTime: '11:00' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('School admin chưa được gán trường học');
    console.log('\n[NEG04] status:', res.status, 'message:', res.body.message);
  });

  it('[NEG05] Giờ bắt đầu >= giờ kết thúc trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });

    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 5', startTime: '11:00', endTime: '10:00' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
    console.log('\n[NEG05] status:', res.status, 'message:', res.body.message);
  });

  it('[NEG06] Khung giờ trùng với slot khác trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    await Slot.create({
      slot_name: 'Tiết 1',
      start_time: '07:00',
      end_time: '08:00',
      school_id: school._id
    });

    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 2', startTime: '07:30', endTime: '08:30' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Khung giờ này bị trùng với một tiết học khác');
    console.log('\n[NEG06] status:', res.status, 'message:', res.body.message);
  });

  it('[POS02] Slot không trùng với slot khác (khác trường)', async () => {
    const school1 = await createTestSchool();
    const school2 = await createTestSchool();
    const admin = await createSchoolAdmin(school2._id);
    await Slot.create({
      slot_name: 'Tiết 1',
      start_time: '07:00',
      end_time: '08:00',
      school_id: school1._id
    });

    const app = buildApp({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/slots')
      .send({ slotName: 'Tiết 1', startTime: '07:00', endTime: '08:00' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saved = await Slot.findOne({ school_id: school2._id, slot_name: 'Tiết 1' });
    expect(saved).toBeTruthy();
    console.log('\n[POS02] Created slot for school2:', saved.slot_name);
  });
});
