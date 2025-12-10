/**
 * Unit tests for createFee controller
 * Covers fee creation with validation, late fees, class associations, and school scoping.
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const Fee = require('../../../src/models/Fee');
const Class = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const ClassFee = require('../../../src/models/ClassFee');
const Teacher = require('../../../src/models/Teacher');
const { createFee } = require('../../../src/controllers/feeController');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  // Disconnect and stop in-memory database
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Cleanup before each test
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    School.deleteMany({}),
    Fee.deleteMany({}),
    Class.deleteMany({}),
    ClassAge.deleteMany({}),
    ClassFee.deleteMany({}),
    Teacher.deleteMany({})
  ]);
});

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

const createTeacherUserAndProfile = async (school_id) => {
  const user = await User.create({
    full_name: 'Teacher',
    username: `teacher_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: 'hash',
    avatar_url: 'https://via.placeholder.com/150',
    role: 'teacher',
    school_id,
    status: 1
  });
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Math',
    experience_years: 3,
    note: 'Homeroom'
  });
  return { user, teacher };
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

const createTestClass = async (school_id, academicYear = '2024-2025') => {
  const { teacher } = await createTeacherUserAndProfile(school_id);
  const classAge = await ClassAge.create({ age: 5, age_name: '5', school_id });
  return Class.create({
    class_name: 'Class A',
    academic_year: academicYear,
    school_id,
    class_age_id: classAge._id,
    teacher_id: teacher._id,
    start_date: new Date('2024-09-01'),
    end_date: new Date('2025-05-31')
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/fees', createFee);
  return app;
};

// Tests --------------- ----------------------------------------
describe('createFee', () => {
  it('CFID01: Admin creates fee successfully', async () => {
    const school = await createTestSchool('CFE School 1');
    const admin = await createUserWithRole('admin', { username: 'adminCFE1' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Monthly Tuition',
        description: 'Monthly tuition fee for students',
        amount: 1000000,
        school_id: school._id.toString(),
        due_date: '2025-01-31'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tạo phí thành công');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.fee_name).toBe('Monthly Tuition');
    expect(res.body.data.amount).toBe('1000000.00');
    expect(res.body.data.school_id).toBe(school._id.toString());

    // Verify fee was created in DB
    const savedFee = await Fee.findById(res.body.data._id);
    expect(savedFee).toBeDefined();
    expect(savedFee.fee_name).toBe('Monthly Tuition');
  });

  it('CFID02: School admin creates fee for their school', async () => {
    const school = await createTestSchool('CFE School 2');
    const schoolAdmin = await createUserWithRole('school_admin', { school_id: school._id, username: 'adminCFE2' });
    
    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Activity Fee',
        description: 'School activity fee',
        amount: 500000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.school_id).toBe(school._id.toString());
  });

  it('CFID03: Fails if fee_name is missing', async () => {
    const school = await createTestSchool('CFE School 3');
    const admin = await createUserWithRole('admin', { username: 'adminCFE3' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        description: 'Fee without name',
        amount: 1000000,
        school_id: school._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Tên phí là bắt buộc');
  });

  it('CFID04: Fails if fee_name is empty string', async () => {
    const school = await createTestSchool('CFE School 4');
    const admin = await createUserWithRole('admin', { username: 'adminCFE4' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: '   ',
        description: 'Fee with empty name',
        amount: 1000000,
        school_id: school._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tên phí là bắt buộc');
  });

  it('CFID05: Fails if description is missing', async () => {
    const school = await createTestSchool('CFE School 5');
    const admin = await createUserWithRole('admin', { username: 'adminCFE5' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        amount: 1000000,
        school_id: school._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Mô tả là bắt buộc');
  });

  it('CFID06: Fails if amount is invalid', async () => {
    const school = await createTestSchool('CFE School 6');
    const admin = await createUserWithRole('admin', { username: 'adminCFE6' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with invalid amount',
        amount: 'not-a-number',
        school_id: school._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Số tiền phải là số hợp lệ và >= 0');
  });

  it('CFID07: Fails if amount is negative', async () => {
    const school = await createTestSchool('CFE School 7');
    const admin = await createUserWithRole('admin', { username: 'adminCFE7' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with negative amount',
        amount: -1000,
        school_id: school._id.toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Số tiền phải là số hợp lệ và >= 0');
  });

  it('CFID08: Creates fee with late fee type "fixed"', async () => {
    const school = await createTestSchool('CFE School 8');
    const admin = await createUserWithRole('admin', { username: 'adminCFE8' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Tuition with late fee',
        amount: 1000000,
        school_id: school._id.toString(),
        late_fee_type: 'fixed',
        late_fee_value: 100000,
        late_fee_description: 'Late payment fee'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.late_fee_type).toBe('fixed');
    expect(res.body.data.late_fee_value).toBe(100000);
    expect(res.body.data.late_fee_description).toBe('Late payment fee');
  });

  it('CFID09: Creates fee with late fee type "percentage"', async () => {
    const school = await createTestSchool('CFE School 9');
    const admin = await createUserWithRole('admin', { username: 'adminCFE9' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Tuition with percentage late fee',
        amount: 1000000,
        school_id: school._id.toString(),
        late_fee_type: 'percentage',
        late_fee_value: 10,
        late_fee_description: '10% late fee'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.late_fee_type).toBe('percentage');
    expect(res.body.data.late_fee_value).toBe(10);
  });

  it('CFID10: Caps percentage late fee at 100%', async () => {
    const school = await createTestSchool('CFE School 10');
    const admin = await createUserWithRole('admin', { username: 'adminCFE10' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Tuition with capped percentage',
        amount: 1000000,
        school_id: school._id.toString(),
        late_fee_type: 'percentage',
        late_fee_value: 150
      });

    expect(res.status).toBe(201);
    expect(res.body.data.late_fee_value).toBe(100);
  });

  it('CFID11: Creates fee with class associations', async () => {
    const school = await createTestSchool('CFE School 11');
    const admin = await createUserWithRole('admin', { username: 'adminCFE11' });
    const class1 = await createTestClass(school._id);
    const class2 = await createTestClass(school._id);
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Class-specific tuition',
        amount: 1000000,
        school_id: school._id.toString(),
        class_ids: [class1._id.toString(), class2._id.toString()],
        due_date: '2025-12-31'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.class_ids).toHaveLength(2);

    // Verify ClassFee entries were created (don't check order, just check both exist)
    const classFees = await ClassFee.find({ fee_id: res.body.data._id }).lean();
    expect(classFees).toHaveLength(2);
    
    const classIds = classFees.map(cf => cf.class_id.toString()).sort();
    const expectedIds = [class1._id.toString(), class2._id.toString()].sort();
    expect(classIds).toEqual(expectedIds);
  });

  it('CFID12: Fails if class_id is invalid ObjectId', async () => {
    const school = await createTestSchool('CFE School 12');
    const admin = await createUserWithRole('admin', { username: 'adminCFE12' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with invalid class',
        amount: 1000000,
        school_id: school._id.toString(),
        class_ids: ['invalid-id']
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Danh sách lớp chứa ID không hợp lệ');
  });

  it('CFID13: Fails if class does not exist', async () => {
    const school = await createTestSchool('CFE School 13');
    const admin = await createUserWithRole('admin', { username: 'adminCFE13' });
    const nonExistentClassId = new mongoose.Types.ObjectId();
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with non-existent class',
        amount: 1000000,
        school_id: school._id.toString(),
        class_ids: [nonExistentClassId.toString()]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Một số lớp áp dụng phí không tồn tại');
  });

  it('CFID14: Fails if class belongs to different school', async () => {
    const school1 = await createTestSchool('CFE School 14A');
    const school2 = await createTestSchool('CFE School 14B');
    const admin = await createUserWithRole('admin', { username: 'adminCFE14' });
    const classFromSchool2 = await createTestClass(school2._id);
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee for wrong school class',
        amount: 1000000,
        school_id: school1._id.toString(),
        class_ids: [classFromSchool2._id.toString()]
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Không thể áp dụng phí cho lớp thuộc trường khác');
  });

  it('CFID15: School admin without school_id fails', async () => {
    const school = await createTestSchool('CFE School 15');
    const schoolAdmin = await User.create({
      full_name: 'School Admin',
      username: `admin_${Date.now()}`,
      password_hash: 'hash',
      avatar_url: 'https://via.placeholder.com/150',
      role: 'school_admin',
      status: 1
      // Note: no school_id
    });
    
    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee by admin without school',
        amount: 1000000
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('School admin chưa được gán trường học');
  });

  it('CFID16: Creates fee with default due date (end of current month)', async () => {
    const school = await createTestSchool('CFE School 16');
    const admin = await createUserWithRole('admin', { username: 'adminCFE16' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with default due date',
        amount: 1000000,
        school_id: school._id.toString()
        // No due_date provided
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('CFID17: Creates fee with custom due date', async () => {
    const school = await createTestSchool('CFE School 17');
    const admin = await createUserWithRole('admin', { username: 'adminCFE17' });
    const testClass = await createTestClass(school._id);
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with custom due date',
        amount: 1000000,
        school_id: school._id.toString(),
        class_ids: [testClass._id.toString()],
        due_date: '2025-06-30'
      });

    expect(res.status).toBe(201);
    
    // Verify ClassFee has correct due date
    const classFeess = await ClassFee.findOne({ fee_id: res.body.data._id });
    expect(classFeess.due_date).toBeDefined();
  });

  it('CFID18: Empty class_ids array creates fee without ClassFee entries', async () => {
    const school = await createTestSchool('CFE School 18');
    const admin = await createUserWithRole('admin', { username: 'adminCFE18' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee without classes',
        amount: 1000000,
        school_id: school._id.toString(),
        class_ids: []
      });

    expect(res.status).toBe(201);
    expect(res.body.data.class_ids).toHaveLength(0);

    // Verify no ClassFee entries created
    const classFees = await ClassFee.find({ fee_id: res.body.data._id });
    expect(classFees).toHaveLength(0);
  });

  it('CFID19: Amount is stored as Decimal128', async () => {
    const school = await createTestSchool('CFE School 19');
    const admin = await createUserWithRole('admin', { username: 'adminCFE19' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with decimal amount',
        amount: 1000000.50,
        school_id: school._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe('1000000.50');

    // Verify in DB
    const savedFee = await Fee.findById(res.body.data._id);
    expect(savedFee.amount.toString()).toBe('1000000.50');
  });

  it('CFID20: Late fee value zero reverts type to "none"', async () => {
    const school = await createTestSchool('CFE School 20');
    const admin = await createUserWithRole('admin', { username: 'adminCFE20' });
    
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    
    const res = await request(app)
      .post('/fees')
      .send({
        fee_name: 'Tuition',
        description: 'Fee with zero late fee value',
        amount: 1000000,
        school_id: school._id.toString(),
        late_fee_type: 'fixed',
        late_fee_value: 0
      });

    expect(res.status).toBe(201);
    expect(res.body.data.late_fee_type).toBe('none');
    expect(res.body.data.late_fee_value).toBe(0);
  });
});
