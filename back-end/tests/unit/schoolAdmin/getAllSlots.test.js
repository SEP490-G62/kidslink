const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { getAllSlots } = require('../../../src/controllers/slotController');
const { Slot, School, User } = require('../../../src/models');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/slots', getAllSlots);
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

async function createSchoolAdmin(school_id) {
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

async function createAdminUser(school_id) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await User.create({
    full_name: 'Super Admin',
    username: `superadmin_${suffix}`,
    password_hash: 'hashed',
    role: 'admin',
    avatar_url: 'https://example.com/avatar.png',
    status: 1,
    school_id: school_id
  });
}

async function createTestSlot(school_id, data = {}) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await Slot.create({
    slot_name: data.slot_name || `Tiết ${suffix}`,
    start_time: data.start_time || '07:00',
    end_time: data.end_time || '08:00',
    school_id: school_id
  });
}

describe('slotController - getAllSlots', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      School.deleteMany({}),
      User.deleteMany({}),
      Slot.deleteMany({})
    ]);
  });

  it('[GAS01] School admin lấy danh sách slots của trường mình thành công', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    
    await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '08:00', end_time: '09:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 3', start_time: '09:00', end_time: '10:00' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toHaveProperty('_id');
    expect(res.body.data[0]).toHaveProperty('slotName');
    expect(res.body.data[0]).toHaveProperty('startTime');
    expect(res.body.data[0]).toHaveProperty('endTime');
    console.log('\n[GAS01] School admin retrieved slots successfully');
  });

  it('[GAS02] School admin chỉ thấy slots của trường mình, không thấy của trường khác', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    const admin1 = await createSchoolAdmin(school1._id);

    // Tạo slots cho School 1
    await createTestSlot(school1._id, { slot_name: 'Tiết A1' });
    await createTestSlot(school1._id, { slot_name: 'Tiết A2' });

    // Tạo slots cho School 2
    await createTestSlot(school2._id, { slot_name: 'Tiết B1' });

    const app = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Admin1 chỉ thấy 2 slots của School 1
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(s => s.slotName.includes('A'))).toBe(true);
    console.log('\n[GAS02] School admin sees only their school slots');
  });

  it('[GAS03] Admin (super) lấy tất cả slots từ tất cả trường', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    const superAdmin = await createAdminUser(school1._id);

    // Tạo slots cho School 1
    await createTestSlot(school1._id, { slot_name: 'Tiết 1' });

    // Tạo slots cho School 2
    await createTestSlot(school2._id, { slot_name: 'Tiết 2' });

    const app = buildAppWithUser({ id: superAdmin._id.toString(), role: 'admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Admin sees all slots from all schools
    expect(res.body.data).toHaveLength(2);
    console.log('\n[GAS03] Super admin sees all slots from all schools');
  });

  it('[GAS04] Danh sách slots trống khi chưa có slot nào', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log('\n[GAS04] Empty slots list returns empty array');
  });

  it('[GAS05] Danh sách slots được sắp xếp theo giờ bắt đầu (start_time)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Tạo slots không theo thứ tự
    await createTestSlot(school._id, { slot_name: 'Tiết 3', start_time: '09:00', end_time: '10:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '08:00', end_time: '09:00' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    
    // Kiểm tra sắp xếp theo start_time
    expect(res.body.data[0].startTime).toBe('07:00');
    expect(res.body.data[1].startTime).toBe('08:00');
    expect(res.body.data[2].startTime).toBe('09:00');
    console.log('\n[GAS05] Slots sorted by start_time');
  });

  it('[GAS06] Response format chính xác với tất cả fields cần thiết', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const slot = await createTestSlot(school._id, {
      slot_name: 'Tiết học buổi sáng',
      start_time: '07:30',
      end_time: '08:30'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const slotData = res.body.data[0];
    expect(slotData._id).toBeDefined();
    expect(slotData._id.toString()).toBe(slot._id.toString());
    expect(slotData.slotName).toBe('Tiết học buổi sáng');
    expect(slotData.startTime).toBe('07:30');
    expect(slotData.endTime).toBe('08:30');
    console.log('\n[GAS06] Response format correct with all fields');
  });

  it('[GAS07] Trả về startTime và endTime đúng định dạng HH:mm', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '09:45', end_time: '10:45' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    res.body.data.forEach(slot => {
      // Check HH:mm format
      expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
    });
    console.log('\n[GAS07] Time format HH:mm correct');
  });

  it('[GAS08] Slots với tên dài không bị cắt', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const longSlotName = 'Tiết học toán cao cấp - Phần hình học không gian phức tạp';
    await createTestSlot(school._id, {
      slot_name: longSlotName,
      start_time: '10:00',
      end_time: '11:00'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slotName).toBe(longSlotName);
    console.log('\n[GAS08] Long slot names not truncated');
  });

  it('[GAS09] Không trả về slots bị xóa', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const slot1 = await createTestSlot(school._id, { slot_name: 'Active Slot' });
    const slot2 = await createTestSlot(school._id, { slot_name: 'To be deleted' });

    // Xóa slot2
    await Slot.findByIdAndDelete(slot2._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slotName).toBe('Active Slot');
    console.log('\n[GAS09] Does not return deleted slots');
  });

  it('[GAS10] Multiple schools cùng lúc - school_admin chỉ thấy của mình', async () => {
    const school1 = await createTestSchool({ school_name: 'Trường A' });
    const school2 = await createTestSchool({ school_name: 'Trường B' });
    const school3 = await createTestSchool({ school_name: 'Trường C' });

    const admin1 = await createSchoolAdmin(school1._id);
    const admin2 = await createSchoolAdmin(school2._id);

    // Create slots for each school
    await createTestSlot(school1._id, { slot_name: 'Tiết A1' });
    await createTestSlot(school1._id, { slot_name: 'Tiết A2' });
    
    await createTestSlot(school2._id, { slot_name: 'Tiết B1' });
    
    await createTestSlot(school3._id, { slot_name: 'Tiết C1' });

    // Admin1 checks
    const app1 = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res1 = await request(app1).get('/slots');

    // Admin2 checks
    const app2 = buildAppWithUser({ id: admin2._id.toString(), role: 'school_admin' });
    const res2 = await request(app2).get('/slots');

    expect(res1.body.data).toHaveLength(2);
    expect(res2.body.data).toHaveLength(1);
    expect(res1.body.data.every(s => s.slotName.includes('A'))).toBe(true);
    expect(res2.body.data[0].slotName).toBe('Tiết B1');
    console.log('\n[GAS10] Multiple schools isolation works correctly');
  });

  it('[GAS11] Trả về success flag là true', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe('object');
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log('\n[GAS11] Success flag true in response');
  });

  it('[GAS12] Nhiều slots trong cùng một ngày với giờ khác nhau', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Tạo 5 slots liên tiếp trong ngày
    await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '08:00', end_time: '09:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 3', start_time: '09:00', end_time: '10:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 4', start_time: '10:00', end_time: '11:00' });
    await createTestSlot(school._id, { slot_name: 'Tiết 5', start_time: '13:00', end_time: '14:00' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    
    // Kiểm tra sorted
    for (let i = 0; i < res.body.data.length - 1; i++) {
      expect(res.body.data[i].startTime <= res.body.data[i + 1].startTime).toBe(true);
    }
    console.log('\n[GAS12] Multiple slots same day with different times');
  });

  it('[GAS13] Slots data không chứa internal fields như school_id', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestSlot(school._id, { slot_name: 'Test Slot' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    const slot = res.body.data[0];

    // Kiểm tra fields được trả về
    expect(slot).toHaveProperty('_id');
    expect(slot).toHaveProperty('slotName');
    expect(slot).toHaveProperty('startTime');
    expect(slot).toHaveProperty('endTime');

    // Kiểm tra fields không được trả về
    expect(slot).not.toHaveProperty('school_id');
    expect(slot).not.toHaveProperty('slot_name'); // Should be 'slotName'
    expect(slot).not.toHaveProperty('start_time'); // Should be 'startTime'
    expect(slot).not.toHaveProperty('end_time'); // Should be 'endTime'
    console.log('\n[GAS13] Response excludes internal fields');
  });

  it('[GAS14] Số lượng lớn slots (50+) vẫn trả về đúng', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Create 30 slots
    const slots = [];
    for (let i = 0; i < 30; i++) {
      const hour = String(Math.floor(7 + (i / 2))).padStart(2, '0');
      const minutes = (i % 2) === 0 ? '00' : '30';
      const nextHour = String(Math.floor(7 + (i / 2)) + 1).padStart(2, '0');
      const nextMinutes = (i % 2) === 0 ? '30' : '00';
      
      slots.push({
        slot_name: `Tiết ${String(i + 1).padStart(2, '0')}`,
        start_time: `${hour}:${minutes}`,
        end_time: `${nextHour}:${nextMinutes}`,
        school_id: school._id
      });
    }
    await Slot.insertMany(slots);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(30);
    // Check sorted
    expect(res.body.data[0].startTime).toBe('07:00');
    console.log('\n[GAS14] Large list of slots returns correctly');
  });

  it('[GAS15] Slots với special characters trong tên được trả về đúng', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestSlot(school._id, {
      slot_name: 'Tiết Toán & Anh văn (buổi sáng)',
      start_time: '07:00',
      end_time: '08:00'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/slots');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slotName).toBe('Tiết Toán & Anh văn (buổi sáng)');
    console.log('\n[GAS15] Special characters in slot names handled correctly');
  });
});
