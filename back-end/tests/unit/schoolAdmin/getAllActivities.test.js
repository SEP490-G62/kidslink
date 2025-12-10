const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { getAllActivities } = require('../../../src/controllers/schoolAdminCalendarController');
const { Activity, School, User } = require('../../../src/models');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/activities', getAllActivities);
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

async function createTestActivity(school_id, data = {}) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await Activity.create({
    activity_name: data.activity_name || `Activity ${suffix}`,
    description: data.description || 'Test activity',
    require_outdoor: data.require_outdoor !== undefined ? data.require_outdoor : 0,
    school_id: school_id
  });
}

describe('schoolAdminCalendarController - getAllActivities', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      School.deleteMany({}),
      User.deleteMany({}),
      Activity.deleteMany({})
    ]);
  });

  it('[GAA01] School admin lấy danh sách activities của trường mình thành công', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);
    
    await createTestActivity(school._id, { activity_name: 'Học toán' });
    await createTestActivity(school._id, { activity_name: 'Học tiếng Anh' });
    await createTestActivity(school._id, { activity_name: 'Thể dục' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0]).toHaveProperty('_id');
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('description');
    expect(res.body.data[0]).toHaveProperty('requireOutdoor');
    console.log('\n[GAA01] School admin retrieved activities successfully');
  });

  it('[GAA02] School admin chỉ thấy activities của trường mình, không thấy của trường khác', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    const admin1 = await createSchoolAdmin(school1._id);

    // Tạo activities cho School 1
    await createTestActivity(school1._id, { activity_name: 'Activity School 1' });
    await createTestActivity(school1._id, { activity_name: 'Activity School 1 #2' });

    // Tạo activities cho School 2
    await createTestActivity(school2._id, { activity_name: 'Activity School 2' });

    const app = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Admin1 chỉ thấy 2 activities của School 1
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(a => a.name.includes('School 1'))).toBe(true);
    console.log('\n[GAA02] School admin sees only their school activities');
  });

  it('[GAA03] Admin (super) lấy tất cả activities từ tất cả trường', async () => {
    const school1 = await createTestSchool({ school_name: 'School 1' });
    const school2 = await createTestSchool({ school_name: 'School 2' });
    const superAdmin = await createAdminUser(school1._id);

    // Tạo activities cho School 1
    await createTestActivity(school1._id, { activity_name: 'Activity School 1' });

    // Tạo activities cho School 2
    await createTestActivity(school2._id, { activity_name: 'Activity School 2' });

    const app = buildAppWithUser({ id: superAdmin._id.toString(), role: 'admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Admin sees all activities from all schools
    expect(res.body.data).toHaveLength(2);
    console.log('\n[GAA03] Super admin sees all activities from all schools');
  });

  it('[GAA04] Danh sách activities trống khi chưa có activity nào', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log('\n[GAA04] Empty activities list returns empty array');
  });

  it('[GAA05] Danh sách activities được sắp xếp theo tên (A-Z)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Tạo activities không theo thứ tự
    await createTestActivity(school._id, { activity_name: 'Yoga' });
    await createTestActivity(school._id, { activity_name: 'Bơi lội' });
    await createTestActivity(school._id, { activity_name: 'Chạy bộ' });
    await createTestActivity(school._id, { activity_name: 'Anh văn' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(4);
    
    // Kiểm tra sắp xếp A-Z
    expect(res.body.data[0].name).toBe('Anh văn');
    expect(res.body.data[1].name).toBe('Bơi lội');
    expect(res.body.data[2].name).toBe('Chạy bộ');
    expect(res.body.data[3].name).toBe('Yoga');
    console.log('\n[GAA05] Activities sorted alphabetically A-Z');
  });

  it('[GAA06] Response format chính xác với tất cả fields cần thiết', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const activity = await createTestActivity(school._id, {
      activity_name: 'Học hát',
      description: 'Lớp học hát tập thể',
      require_outdoor: 1
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const activityData = res.body.data[0];
    expect(activityData._id).toBeDefined();
    expect(activityData._id.toString()).toBe(activity._id.toString());
    expect(activityData.name).toBe('Học hát');
    expect(activityData.description).toBe('Lớp học hát tập thể');
    expect(activityData.requireOutdoor).toBe(1);
    console.log('\n[GAA06] Response format correct with all fields');
  });

  it('[GAA07] Trả về requireOutdoor đúng giá trị (0 hoặc 1)', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestActivity(school._id, { activity_name: 'Ngoài trời', require_outdoor: 1 });
    await createTestActivity(school._id, { activity_name: 'Trong nhà', require_outdoor: 0 });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    const outdoorActivity = res.body.data.find(a => a.name === 'Ngoài trời');
    const indoorActivity = res.body.data.find(a => a.name === 'Trong nhà');

    expect(outdoorActivity.requireOutdoor).toBe(1);
    expect(indoorActivity.requireOutdoor).toBe(0);
    console.log('\n[GAA07] requireOutdoor values correct (0 or 1)');
  });

  it('[GAA08] Bao gồm tất cả activities dù có description dài', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const longDescription = 'Đây là một hoạt động rất thú vị giúp các em phát triển kỹ năng sáng tạo, tư duy logic và khả năng hợp tác với bạn bè. Hoạt động này kết hợp giáo dục và giải trí để tạo ra trải nghiệm học tập tốt nhất cho các em.';
    
    await createTestActivity(school._id, {
      activity_name: 'Hoạt động phức tạp',
      description: longDescription,
      require_outdoor: 1
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].description).toBe(longDescription);
    console.log('\n[GAA08] Includes activities with long descriptions');
  });

  it('[GAA09] Không trả về activities bị xóa hoặc inactive', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const activity1 = await createTestActivity(school._id, { activity_name: 'Active Activity' });
    const activity2 = await createTestActivity(school._id, { activity_name: 'To be deleted' });

    // Xóa activity2
    await Activity.findByIdAndDelete(activity2._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Active Activity');
    console.log('\n[GAA09] Does not return deleted activities');
  });

  it('[GAA10] Multiple schools cùng lúc - school_admin chỉ thấy của mình', async () => {
    const school1 = await createTestSchool({ school_name: 'Trường A' });
    const school2 = await createTestSchool({ school_name: 'Trường B' });
    const school3 = await createTestSchool({ school_name: 'Trường C' });

    const admin1 = await createSchoolAdmin(school1._id);
    const admin2 = await createSchoolAdmin(school2._id);

    // Create activities for each school
    await createTestActivity(school1._id, { activity_name: 'Activity A1' });
    await createTestActivity(school1._id, { activity_name: 'Activity A2' });
    
    await createTestActivity(school2._id, { activity_name: 'Activity B1' });
    
    await createTestActivity(school3._id, { activity_name: 'Activity C1' });

    // Admin1 checks
    const app1 = buildAppWithUser({ id: admin1._id.toString(), role: 'school_admin' });
    const res1 = await request(app1).get('/activities');

    // Admin2 checks
    const app2 = buildAppWithUser({ id: admin2._id.toString(), role: 'school_admin' });
    const res2 = await request(app2).get('/activities');

    expect(res1.body.data).toHaveLength(2);
    expect(res2.body.data).toHaveLength(1);
    expect(res1.body.data.every(a => a.name.includes('A'))).toBe(true);
    expect(res2.body.data[0].name).toBe('Activity B1');
    console.log('\n[GAA10] Multiple schools isolation works correctly');
  });

  it('[GAA11] Trả về success flag là true', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe('object');
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log('\n[GAA11] Success flag true in response');
  });

  it('[GAA12] Nhiều activities cùng outdoor status', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Tạo nhiều outdoor activities
    await createTestActivity(school._id, { activity_name: 'Bóng đá', require_outdoor: 1 });
    await createTestActivity(school._id, { activity_name: 'Cờ vua', require_outdoor: 0 });
    await createTestActivity(school._id, { activity_name: 'Chạy bộ', require_outdoor: 1 });
    await createTestActivity(school._id, { activity_name: 'Vẽ tranh', require_outdoor: 0 });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);

    const outdoorActivities = res.body.data.filter(a => a.requireOutdoor === 1);
    const indoorActivities = res.body.data.filter(a => a.requireOutdoor === 0);

    expect(outdoorActivities).toHaveLength(2);
    expect(indoorActivities).toHaveLength(2);
    console.log('\n[GAA12] Multiple activities with mixed outdoor status');
  });

  it('[GAA13] Activities data không chứa internal fields như school_id', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestActivity(school._id, { activity_name: 'Test Activity' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    const activity = res.body.data[0];

    // Kiểm tra fields được trả về
    expect(activity).toHaveProperty('_id');
    expect(activity).toHaveProperty('name');
    expect(activity).toHaveProperty('description');
    expect(activity).toHaveProperty('requireOutdoor');

    // Kiểm tra fields không được trả về
    expect(activity).not.toHaveProperty('school_id');
    expect(activity).not.toHaveProperty('activity_name'); // Should be 'name'
    expect(activity).not.toHaveProperty('require_outdoor'); // Should be 'requireOutdoor'
    console.log('\n[GAA13] Response excludes internal fields');
  });

  it('[GAA14] Số lượng lớn activities (50+) vẫn trả về đúng', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    // Create 50 activities
    const activities = [];
    for (let i = 1; i <= 50; i++) {
      activities.push({
        activity_name: `Activity ${String(i).padStart(2, '0')}`,
        description: `Description for activity ${i}`,
        require_outdoor: i % 2,
        school_id: school._id
      });
    }
    await Activity.insertMany(activities);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(50);
    // Check sorted
    expect(res.body.data[0].name).toBe('Activity 01');
    console.log('\n[GAA14] Large list of activities returns correctly');
  });

  it('[GAA15] Activity names với special characters được trả về đúng', async () => {
    const school = await createTestSchool();
    const admin = await createSchoolAdmin(school._id);

    await createTestActivity(school._id, {
      activity_name: 'Học tiếng Anh & Toán',
      description: 'Test (với) special @#$ characters'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .get('/activities');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Học tiếng Anh & Toán');
    expect(res.body.data[0].description).toContain('special @#$ characters');
    console.log('\n[GAA15] Special characters in activity names handled correctly');
  });
});
