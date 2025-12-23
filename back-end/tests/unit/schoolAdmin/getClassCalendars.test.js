const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { getClassCalendars } = require('../../../src/controllers/schoolAdminCalendarController');
const { Class: ClassModel, School, User, Teacher, ClassAge, Calendar, Slot, Activity, WeekDay } = require('../../../src/models');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/calendar/class/:classId', getClassCalendars);
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
    day_of_week: data.day_of_week || 1,
    day_name: data.day_name || 'Thứ 2'
  });
}

async function createTestCalendar(class_id, slot_id, teacher_id, weekday_id, activity_id, data = {}) {
  return await Calendar.create({
    class_id: class_id,
    slot_id: slot_id,
    teacher_id: teacher_id,
    weekday_id: weekday_id,
    activity_id: activity_id,
    date: data.date || new Date('2024-09-02')
  });
}

describe('schoolAdminCalendarController - getClassCalendars', () => {
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

  it('[GCC01] Lấy lịch học của lớp thành công (school_admin)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);
    
    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.class.name).toBe('Lớp A1');
    expect(res.body.data.calendars.length).toBe(1);
    console.log('\n[GCC01] Lịch học lớp:', testClass.class_name);
  });

  it('[GCC02] Lấy lịch học với bộ lọc ngày (startDate, endDate)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);

    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });
    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-09')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get(`/calendar/class/${testClass._id}`)
      .query({ startDate: '2024-09-02', endDate: '2024-09-05' });

    expect(res.status).toBe(200);
    expect(res.body.data.calendars.length).toBe(1);
    console.log('\n[GCC02] Bộ lọc ngày hoạt động');
  });

  it('[GCC03] Lấy lịch học không có ngày cụ thể (trả tất cả)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);

    for (let i = 0; i < 3; i++) {
      await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
        date: new Date(`2024-09-0${2 + i}`)
      });
    }

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.calendars.length).toBe(3);
    console.log('\n[GCC03] Tất cả lịch học được trả:', res.body.data.calendars.length, 'ngày');
  });

  it('[GCC04] Class không tồn tại trả 404', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const fakeClassId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${fakeClassId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    console.log('\n[GCC04] Class không tồn tại trả 404:', res.status);
  });

  it('[GCC05] School admin xem lịch lớp của trường khác bị từ chối (403)', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    
    const admin1 = await createSchoolAdmin(school1._id);
    const classAge = await createTestClassAge(school2._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id);
    const testClass = await createTestClass(school2._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    console.log('\n[GCC05] School admin xem lớp của trường khác bị từ chối:', res.status);
  });

  it('[GCC06] Admin (super) có thể xem lịch của bất kỳ lớp nào', async () => {
    const school = await createTestSchool();
    const superAdmin = await createAdminUser(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);

    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id);

    const app = buildAppWithUser({ id: superAdmin._id.toString(), role: 'admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('\n[GCC06] Admin có thể xem lịch:', res.status);
  });

  it('[GCC07] Trả về thông tin lớp chính xác (name, academicYear)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id, {
      class_name: 'Lớp B2',
      academic_year: '2024-2025'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.class.name).toBe('Lớp B2');
    expect(res.body.data.class.academicYear).toBe('2024-2025');
    console.log('\n[GCC07] Thông tin lớp chính xác:', res.body.data.class.name);
  });

  it('[GCC08] Trả về thông tin giáo viên chủ nhiệm (nếu có)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher, user: teacherUser } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.class.teacher).toBeDefined();
    expect(res.body.data.class.teacher.fullName).toBe(teacherUser.full_name);
    console.log('\n[GCC08] Thông tin giáo viên chủ nhiệm:', res.body.data.class.teacher.fullName);
  });

  it('[GCC09] TimeSlots được trả đúng format (id, slotName, startTime, endTime)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    
    const slot1 = await createTestSlot(school._id, { slot_name: 'Tiết 1', start_time: '07:00', end_time: '08:00' });
    const slot2 = await createTestSlot(school._id, { slot_name: 'Tiết 2', start_time: '08:00', end_time: '09:00' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.timeSlots.length).toBe(2);
    expect(res.body.data.timeSlots[0].slotName).toBeDefined();
    expect(res.body.data.timeSlots[0].startTime).toBeDefined();
    console.log('\n[GCC09] TimeSlots format OK');
  });

  it('[GCC10] Calendar entry có đầy đủ thông tin (slot, activity, teacher)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher, user: teacherUser } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id, { slot_name: 'Tiết 1' });
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id, { activity_name: 'Học toán' });

    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    const slotData = res.body.data.calendars[0].slots[0];
    expect(slotData.slotName).toBe('Tiết 1');
    expect(slotData.activity.name).toBe('Học toán');
    expect(slotData.teacher.fullName).toBeDefined();
    console.log('\n[GCC10] Calendar entry đầy đủ thông tin');
  });

  it('[GCC11] Nhiều slots trong cùng ngày được gom lại cùng date', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot1 = await createTestSlot(school._id, { slot_name: 'Tiết 1' });
    const slot2 = await createTestSlot(school._id, { slot_name: 'Tiết 2' });
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);

    await createTestCalendar(testClass._id, slot1._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });
    await createTestCalendar(testClass._id, slot2._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.calendars.length).toBe(1);
    expect(res.body.data.calendars[0].slots.length).toBe(2);
    console.log('\n[GCC11] Nhiều tiết trong cùng ngày gom lại:', res.body.data.calendars[0].slots.length);
  });

  it('[GCC12] Calendars được sắp xếp theo ngày tăng dần', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);
    const slot = await createTestSlot(school._id);
    const weekday = await createTestWeekDay();
    const activity = await createTestActivity(school._id);

    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-09')
    });
    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-02')
    });
    await createTestCalendar(testClass._id, slot._id, teacher._id, weekday._id, activity._id, {
      date: new Date('2024-09-05')
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.calendars.length).toBe(3);
    const dates = res.body.data.calendars.map(c => c._id);
    expect(dates[0]).toBe('2024-09-02');
    expect(dates[1]).toBe('2024-09-05');
    expect(dates[2]).toBe('2024-09-09');
    console.log('\n[GCC12] Calendars được sắp xếp:', dates);
  });

  it('[GCC13] School admin không được gán trường trả 400', async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const adminNoSchool = await User.create({
      full_name: 'Admin No School',
      username: `admin_no_school_${suffix}`,
      password_hash: 'hashed',
      role: 'school_admin',
      avatar_url: 'https://example.com/avatar.png',
      status: 1,
      school_id: null
    });

    const school = await createTestSchool();
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: adminNoSchool._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    console.log('\n[GCC13] School admin không được gán trường trả 400:', res.status);
  });

  it('[GCC14] Trả về response structure đúng format', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.class).toBeDefined();
    expect(res.body.data.timeSlots).toBeDefined();
    expect(res.body.data.calendars).toBeDefined();
    expect(Array.isArray(res.body.data.timeSlots)).toBe(true);
    expect(Array.isArray(res.body.data.calendars)).toBe(true);
    console.log('\n[GCC14] Response structure đúng format');
  });

  it('[GCC15] Calendars để trống khi không có dữ liệu', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, classAge._id, teacher._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app).get(`/calendar/class/${testClass._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calendars).toEqual([]);
    console.log('\n[GCC15] Calendars để trống khi không có dữ liệu');
  });
});
