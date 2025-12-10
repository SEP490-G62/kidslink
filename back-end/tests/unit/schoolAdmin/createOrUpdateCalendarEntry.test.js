const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { createOrUpdateCalendarEntry } = require('../../../src/controllers/schoolAdminCalendarController');
const { Class: ClassModel, School, User, Teacher, ClassAge, Calendar, Slot, Activity, WeekDay } = require('../../../src/models');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/calendar/:calendarId', createOrUpdateCalendarEntry);
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

async function createTeacherUserAndProfile(school_id) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const user = await User.create({
    full_name: `Teacher ${suffix}`,
    email: `teacher${suffix}@test.com`,
    username: `teacher${suffix}`,
    password_hash: 'hashedpassword',
    role: 'teacher',
    school_id: school_id,
    avatar_url: 'https://example.com/avatar.png',
    status: 1
  });
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Cử nhân',
    major: 'Sư phạm mầm non',
    experience_years: 5,
    note: 'Giáo viên giỏi'
  });
  return { user, teacher };
}

async function createTestClassAge(school_id) {
  return await ClassAge.create({
    school_id: school_id,
    age_name: '3-4 tuổi',
    age: 3
  });
}

async function createTestClass(school_id, class_age_id, teacher_id, data = {}) {
  return await ClassModel.create({
    class_name: data.class_name || 'Lớp A1',
    school_id: school_id,
    class_age_id: class_age_id,
    teacher_id: teacher_id,
    teacher_id2: data.teacher_id2 || null,
    academic_year: data.academic_year || '2024-2025',
    start_date: data.start_date || '2024-09-01',
    end_date: data.end_date || '2025-06-30'
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

async function createTestActivity(school_id, data = {}) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await Activity.create({
    activity_name: data.activity_name || `Activity ${suffix}`,
    description: data.description || 'Test activity',
    require_outdoor: data.require_outdoor !== undefined ? data.require_outdoor : 0,
    school_id: school_id
  });
}

async function createTestWeekDay(data = {}) {
  return await WeekDay.create({
    day_of_week: data.day_of_week || 'Monday',
    day_name: data.day_name || 'Thứ 2'
  });
}

describe('schoolAdminCalendarController - createOrUpdateCalendarEntry', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({}),
      Calendar.deleteMany({}),
      Slot.deleteMany({}),
      Activity.deleteMany({}),
      WeekDay.deleteMany({})
    ]);
  });

  it('[CUOC01] Tạo calendar entry mới thành công', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const activity = await createTestActivity(school._id);
    await createTestWeekDay({ day_of_week: 'Monday' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Đã thêm lịch học mới');
    expect(res.body.data.slotName).toBe('Tiết 1');
    expect(res.body.data.activity.name).toBeDefined();
    
    const saved = await Calendar.findById(res.body.data.id);
    expect(saved).toBeTruthy();
    console.log('\n[CUOC01] Calendar entry created:', saved._id);
  });

  it('[CUOC02] Cập nhật calendar entry thành công', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot1 = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const slot2 = await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '08:00', end_time: '09:00' });
    const activity1 = await createTestActivity(school._id, { activity_name: 'Activity 1' });
    const activity2 = await createTestActivity(school._id, { activity_name: 'Activity 2' });
    await createTestWeekDay({ day_of_week: 'Monday' });

    const calendar = await Calendar.create({
      class_id: testClass._id,
      slot_id: slot1._id,
      teacher_id: teacher._id,
      weekday_id: new mongoose.Types.ObjectId(),
      activity_id: activity1._id,
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post(`/calendar/${calendar._id}`)
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot2._id.toString(),
        activityId: activity2._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Đã cập nhật lịch học');
    expect(res.body.data.slotName).toBe('Tiết 2');
    expect(res.body.data.activity.name).toBe('Activity 2');
    
    const updated = await Calendar.findById(calendar._id);
    expect(updated.slot_id.toString()).toBe(slot2._id.toString());
    console.log('\n[CUOC02] Calendar entry updated');
  });

  it('[CUOC03] Thiếu classId trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const slot = await createTestSlot(school._id);
    const activity = await createTestActivity(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    console.log('\n[CUOC03] Missing classId returns 400');
  });

  it('[CUOC04] Thiếu date trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const activity = await createTestActivity(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    console.log('\n[CUOC04] Missing date returns 400');
  });

  it('[CUOC05] Thiếu slotId trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const activity = await createTestActivity(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    console.log('\n[CUOC05] Missing slotId returns 400');
  });

  it('[CUOC06] Thiếu activityId trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    console.log('\n[CUOC06] Missing activityId returns 400');
  });

  it('[CUOC07] Class không tồn tại trả 404', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const slot = await createTestSlot(school._id);
    const activity = await createTestActivity(school._id);
    const fakeClassId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: fakeClassId.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy lớp học');
    console.log('\n[CUOC07] Non-existent class returns 404');
  });

  it('[CUOC08] Slot không tồn tại trả 404', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const activity = await createTestActivity(school._id);
    const fakeSlotId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: fakeSlotId.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy khung giờ tiết học');
    console.log('\n[CUOC08] Non-existent slot returns 404');
  });

  it('[CUOC09] Activity không tồn tại trả 404', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const fakeActivityId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: fakeActivityId.toString()
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy hoạt động');
    console.log('\n[CUOC09] Non-existent activity returns 404');
  });

  it('[CUOC10] School admin xem lớp của trường khác bị từ chối (403)', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    const admin1 = await createSchoolAdmin(school1._id);
    
    const classAge = await createTestClassAge(school2._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id);
    const testClass = await createTestClass(school2._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school1._id);
    const activity = await createTestActivity(school1._id);

    const app = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    console.log('\n[CUOC10] Cross-school access denied (403)');
  });

  it('[CUOC11] Lớp không có giáo viên chủ nhiệm trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    
    const testClass = await ClassModel.create({
      class_name: 'Lớp No Teacher',
      school_id: school._id,
      class_age_id: classAge._id,
      teacher_id: teacher._id,
      academic_year: '2024-2025',
      start_date: '2024-09-01',
      end_date: '2025-06-30'
    });
    
    // Update to remove teacher
    await ClassModel.findByIdAndUpdate(testClass._id, { teacher_id: null });
    
    const slot = await createTestSlot(school._id);
    const activity = await createTestActivity(school._id);
    await createTestWeekDay({ day_of_week: 'Monday' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/giáo viên/i);
    console.log('\n[CUOC11] Class without teacher returns 400');
  });

  it('[CUOC12] Tiết học bị trùng trong ngày trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot1 = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const slot2 = await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '07:30', end_time: '08:30' });
    const activity = await createTestActivity(school._id);
    const weekday = await createTestWeekDay({ day_of_week: 'Monday' });

    // Create first calendar entry
    await Calendar.create({
      class_id: testClass._id,
      slot_id: slot1._id,
      teacher_id: teacher._id,
      weekday_id: weekday._id,
      activity_id: activity._id,
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot2._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/trùng/i);
    console.log('\n[CUOC12] Overlapping time slots returns 400');
  });

  it('[CUOC13] Giáo viên đã dạy lớp khác cùng khung giờ trả 400', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    
    const testClass1 = await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp A1' });
    const testClass2 = await createTestClass(school._id, classAge._id, teacher._id, { class_name: 'Lớp B1' });
    
    const slot = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const activity = await createTestActivity(school._id);
    const weekday = await createTestWeekDay({ day_of_week: 'Monday' });

    // Create first calendar entry for class A1
    await Calendar.create({
      class_id: testClass1._id,
      slot_id: slot._id,
      teacher_id: teacher._id,
      weekday_id: weekday._id,
      activity_id: activity._id,
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass2._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/giáo viên.*khác/i);
    console.log('\n[CUOC13] Teacher conflict returns 400');
  });

  it('[CUOC14] Trả về đúng response format cho create', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const activity = await createTestActivity(school._id, { activity_name: 'Học toán' });
    await createTestWeekDay({ day_of_week: 'Monday' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.slotName).toBe('Tiết 1');
    expect(res.body.data.startTime).toBe('07:00');
    expect(res.body.data.endTime).toBe('08:00');
    expect(res.body.data.activity.name).toBe('Học toán');
    expect(res.body.data.teacher).toBeDefined();
    console.log('\n[CUOC14] Response format correct for create');
  });

  it('[CUOC15] Admin (super) có thể tạo calendar entry', async () => {
    const school = await createTestSchool();
    const superAdmin = await createAdminUser(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const activity = await createTestActivity(school._id);
    await createTestWeekDay({ day_of_week: 'Monday' });

    const app = buildAppWithUser({ id: superAdmin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post('/calendar/new')
      .send({
        classId: testClass._id.toString(),
        date: '2024-09-02',
        slotId: slot._id.toString(),
        activityId: activity._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    console.log('\n[CUOC15] Admin can create calendar entry');
  });
});
