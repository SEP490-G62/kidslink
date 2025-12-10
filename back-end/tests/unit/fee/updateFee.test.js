/**
 * Unit tests for updateFee controller
 * Covers fee updates with validation, late fees, class associations, and school scoping.
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const Fee = require('../../../src/models/Fee');
const Class = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const ClassFee = require('../../../src/models/ClassFee');
const Teacher = require('../../../src/models/Teacher');
const { updateFee } = require('../../../src/controllers/feeController');

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

const createTestFee = async (school_id) => {
  return Fee.create({
    fee_name: 'Test Fee',
    description: 'Test fee description',
    amount: mongoose.Types.Decimal128.fromString('1000000.00'),
    school_id,
    late_fee_type: 'none',
    late_fee_value: 0,
    late_fee_description: ''
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.put('/fees/:id', updateFee);
  return app;
};

// Tests --------------- ----------------------------------------
describe('updateFee', () => {
  it('UFID01: Admin updates fee name successfully', async () => {
    const school = await createTestSchool('UFE School 1');
    const admin = await createUserWithRole('admin', { username: 'adminUFE1' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        fee_name: 'Updated Fee Name'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cập nhật phí thành công');
    expect(res.body.data.fee_name).toBe('Updated Fee Name');

    // Verify in DB
    const updated = await Fee.findById(fee._id);
    expect(updated.fee_name).toBe('Updated Fee Name');
  });

  it('UFID02: School admin updates fee in their school', async () => {
    const school = await createTestSchool('UFE School 2');
    const schoolAdmin = await createUserWithRole('school_admin', { school_id: school._id, username: 'adminUFE2' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        description: 'Updated description'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Updated description');
  });

  it('UFID03: School admin cannot update fee from other school', async () => {
    const school1 = await createTestSchool('UFE School 3A');
    const school2 = await createTestSchool('UFE School 3B');
    const schoolAdmin = await createUserWithRole('school_admin', { school_id: school1._id, username: 'adminUFE3' });
    const fee = await createTestFee(school2._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        fee_name: 'Hacked Fee'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Bạn không có quyền');
  });

  it('UFID04: Fails with invalid fee ID format', async () => {
    const school = await createTestSchool('UFE School 4');
    const admin = await createUserWithRole('admin', { username: 'adminUFE4' });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put('/fees/invalid-id')
      .send({
        fee_name: 'Updated'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('ID không hợp lệ');
  });

  it('UFID05: Fails if fee not found', async () => {
    const school = await createTestSchool('UFE School 5');
    const admin = await createUserWithRole('admin', { username: 'adminUFE5' });
    const nonExistentId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${nonExistentId.toString()}`)
      .send({
        fee_name: 'Updated'
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy phí');
  });

  it('UFID06: Fails if fee_name is empty', async () => {
    const school = await createTestSchool('UFE School 6');
    const admin = await createUserWithRole('admin', { username: 'adminUFE6' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        fee_name: '   '
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tên phí không được để trống');
  });

  it('UFID07: Fails if description is empty', async () => {
    const school = await createTestSchool('UFE School 7');
    const admin = await createUserWithRole('admin', { username: 'adminUFE7' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        description: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Mô tả không được để trống');
  });

  it('UFID08: Fails if amount is invalid', async () => {
    const school = await createTestSchool('UFE School 8');
    const admin = await createUserWithRole('admin', { username: 'adminUFE8' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        amount: 'invalid'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Số tiền phải là số hợp lệ và >= 0');
  });

  it('UFID09: Fails if amount is negative', async () => {
    const school = await createTestSchool('UFE School 9');
    const admin = await createUserWithRole('admin', { username: 'adminUFE9' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        amount: -500000
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Số tiền phải là số hợp lệ và >= 0');
  });

  it('UFID10: Updates amount to Decimal128', async () => {
    const school = await createTestSchool('UFE School 10');
    const admin = await createUserWithRole('admin', { username: 'adminUFE10' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        amount: 2000000.50
      });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe('2000000.50');
  });

  it('UFID11: Updates late fee type to "fixed"', async () => {
    const school = await createTestSchool('UFE School 11');
    const admin = await createUserWithRole('admin', { username: 'adminUFE11' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        late_fee_type: 'fixed',
        late_fee_value: 100000,
        late_fee_description: 'Fixed late fee'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.late_fee_type).toBe('fixed');
    expect(res.body.data.late_fee_value).toBe(100000);
  });

  it('UFID12: Updates late fee type to "percentage"', async () => {
    const school = await createTestSchool('UFE School 12');
    const admin = await createUserWithRole('admin', { username: 'adminUFE12' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        late_fee_type: 'percentage',
        late_fee_value: 15
      });

    expect(res.status).toBe(200);
    expect(res.body.data.late_fee_type).toBe('percentage');
    expect(res.body.data.late_fee_value).toBe(15);
  });

  it('UFID13: Caps percentage late fee at 100%', async () => {
    const school = await createTestSchool('UFE School 13');
    const admin = await createUserWithRole('admin', { username: 'adminUFE13' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        late_fee_type: 'percentage',
        late_fee_value: 150
      });

    expect(res.status).toBe(200);
    expect(res.body.data.late_fee_value).toBe(100);
  });

  it('UFID14: School admin cannot change school_id', async () => {
    const school1 = await createTestSchool('UFE School 14A');
    const school2 = await createTestSchool('UFE School 14B');
    const schoolAdmin = await createUserWithRole('school_admin', { school_id: school1._id, username: 'adminUFE14' });
    const fee = await createTestFee(school1._id);

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin', username: schoolAdmin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        school_id: school2._id.toString()
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('School admin không được phép');
  });

  it('UFID15: Admin can change school_id', async () => {
    const school1 = await createTestSchool('UFE School 15A');
    const school2 = await createTestSchool('UFE School 15B');
    const admin = await createUserWithRole('admin', { username: 'adminUFE15' });
    const fee = await createTestFee(school1._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        school_id: school2._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.data.school_id).toBe(school2._id.toString());
  });

  it('UFID16: Adds classes to fee via class_ids', async () => {
    const school = await createTestSchool('UFE School 16');
    const admin = await createUserWithRole('admin', { username: 'adminUFE16' });
    const fee = await createTestFee(school._id);
    const class1 = await createTestClass(school._id);
    const class2 = await createTestClass(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        class_ids: [class1._id.toString(), class2._id.toString()]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.class_ids).toHaveLength(2);

    // Verify ClassFee entries created
    const classFees = await ClassFee.find({ fee_id: fee._id, status: 1 });
    expect(classFees).toHaveLength(2);
  });

  it('UFID17: Removes classes from fee', async () => {
    const school = await createTestSchool('UFE School 17');
    const admin = await createUserWithRole('admin', { username: 'adminUFE17' });
    const class1 = await createTestClass(school._id);
    const class2 = await createTestClass(school._id);
    
    // Create fee with classes
    const fee = await Fee.create({
      fee_name: 'Fee with classes',
      description: 'Has classes',
      amount: mongoose.Types.Decimal128.fromString('1000000.00'),
      school_id: school._id,
      late_fee_type: 'none',
      late_fee_value: 0,
      late_fee_description: ''
    });

    await ClassFee.create({
      fee_id: fee._id,
      class_id: class1._id,
      due_date: new Date(),
      status: 1
    });

    await ClassFee.create({
      fee_id: fee._id,
      class_id: class2._id,
      due_date: new Date(),
      status: 1
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    // Remove all classes
    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        class_ids: []
      });

    expect(res.status).toBe(200);
    expect(res.body.data.class_ids).toHaveLength(0);

    // Verify ClassFee entries set to inactive
    const activeFees = await ClassFee.find({ fee_id: fee._id, status: 1 });
    expect(activeFees).toHaveLength(0);
  });

  it('UFID18: Fails if class belongs to different school', async () => {
    const school1 = await createTestSchool('UFE School 18A');
    const school2 = await createTestSchool('UFE School 18B');
    const admin = await createUserWithRole('admin', { username: 'adminUFE18' });
    const fee = await createTestFee(school1._id);
    const classFromSchool2 = await createTestClass(school2._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        class_ids: [classFromSchool2._id.toString()]
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Không thể áp dụng phí');
  });

  it('UFID19: Updates all fields together', async () => {
    const school = await createTestSchool('UFE School 19');
    const admin = await createUserWithRole('admin', { username: 'adminUFE19' });
    const fee = await createTestFee(school._id);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        fee_name: 'Complete Update',
        description: 'All fields updated',
        amount: 5000000,
        late_fee_type: 'percentage',
        late_fee_value: 10,
        late_fee_description: '10% penalty'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.fee_name).toBe('Complete Update');
    expect(res.body.data.description).toBe('All fields updated');
    expect(res.body.data.amount).toBe('5000000.00');
    expect(res.body.data.late_fee_type).toBe('percentage');
  });

  it('UFID20: Late fee value zero reverts type to "none"', async () => {
    const school = await createTestSchool('UFE School 20');
    const admin = await createUserWithRole('admin', { username: 'adminUFE20' });
    
    // Create fee with late fee
    const fee = await Fee.create({
      fee_name: 'Fee with late fee',
      description: 'Has late fee',
      amount: mongoose.Types.Decimal128.fromString('1000000.00'),
      school_id: school._id,
      late_fee_type: 'fixed',
      late_fee_value: 100000,
      late_fee_description: 'Late fee'
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });

    const res = await request(app)
      .put(`/fees/${fee._id.toString()}`)
      .send({
        late_fee_value: 0
      });

    expect(res.status).toBe(200);
    expect(res.body.data.late_fee_type).toBe('none');
    expect(res.body.data.late_fee_value).toBe(0);
  });
});
