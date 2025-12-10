const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const {
  Parent,
  ParentStudent,
  Student,
  StudentClass,
  Class: ClassModel,
  ClassFee,
  Fee,
  Invoice,
  School,
  User,
  Teacher,
  ClassAge,
} = require('../../../src/models');
const { getStudentFees } = require('../../../src/controllers/parent/feeController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.get('/parent/fees', getStudentFees);
  return app;
}

// Helpers -------------------------------------------------
async function createTestSchool() {
  return await School.create({
    school_name: 'Test School',
    address: '123 Test St',
    phone_number: '0123456789',
    phone: `phone${Date.now()}${Math.random()}`,
    email: `school${Date.now()}${Math.random()}@test.com`,
    logo_url: 'https://example.com/logo.png'
  });
}

async function createUserWithRole(school_id, role) {
  return await User.create({
    full_name: `Test ${role}`,
    email: `${role}${Date.now()}${Math.random()}@test.com`,
    username: `user${Date.now()}${Math.random()}`,
    password_hash: 'hashedpassword',
    role,
    school_id,
    avatar_url: 'https://example.com/avatar.png'
  });
}

async function createTeacherUserAndProfile(school_id) {
  const user = await createUserWithRole(school_id, 'teacher');
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Cử nhân',
    major: 'Sư phạm',
    experience_years: 3,
    note: 'GV'
  });
  return { user, teacher };
}

async function createTestClassAge(school_id) {
  return await ClassAge.create({
    school_id,
    age_name: '3-4',
    age: 3
  });
}

async function createTestClass(school_id, class_age_id, teacher_id, data = {}) {
  return await ClassModel.create({
    class_name: data.class_name || 'Lớp A1',
    school_id,
    class_age_id,
    teacher_id,
    teacher_id2: data.teacher_id2 || null,
    academic_year: data.academic_year || '2024-2025',
    start_date: data.start_date || '2024-09-01',
    end_date: data.end_date || '2025-06-30'
  });
}

async function createStudent(school_id, full_name = 'Bé A') {
  return await Student.create({
    full_name,
    school_id,
    dob: new Date('2020-01-01'),
    gender: 0,
    avatar_url: ''
  });
}

async function createStudentClass(student_id, class_id, discount = 0) {
  return await StudentClass.create({
    student_id,
    class_id,
    discount
  });
}

async function createParentUserAndProfile(school_id) {
  const user = await createUserWithRole(school_id, 'parent');
  const parent = await Parent.create({ user_id: user._id });
  return { user, parent };
}

async function linkParentStudent(parent_id, student_id) {
  return await ParentStudent.create({
    parent_id,
    student_id,
    relationship: 'Bố'
  });
}

async function createFee(school_id, overrides = {}) {
  return await Fee.create({
    school_id,
    fee_name: overrides.fee_name || 'Học phí',
    description: overrides.description || 'Mô tả',
    amount: mongoose.Types.Decimal128.fromString(String(overrides.amount || 100000)),
    late_fee_type: overrides.late_fee_type || 'none',
    late_fee_value: overrides.late_fee_value || 0,
    late_fee_description: overrides.late_fee_description || ''
  });
}

async function createClassFee(class_id, fee_id, due_date, status = 1) {
  return await ClassFee.create({
    class_id,
    fee_id,
    due_date,
    status
  });
}

describe('Parent Fee Controller - getStudentFees', () => {
  beforeEach(async () => {
    await Promise.all([
      Parent.deleteMany({}),
      ParentStudent.deleteMany({}),
      Student.deleteMany({}),
      StudentClass.deleteMany({}),
      ClassModel.deleteMany({}),
      ClassFee.deleteMany({}),
      Fee.deleteMany({}),
      Invoice.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({}),
    ]);
  });

  // GSF01: Parent không tồn tại
  it('[GSF01] Parent không tồn tại trả về 404', async () => {
    const school = await createTestSchool();
    const parentUser = await createUserWithRole(school._id, 'parent');

    const app = buildAppWithUser({ id: parentUser._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy thông tin phụ huynh');
    console.log('\n[GSF01] status:', res.status, 'message:', res.body.message);
  });

  // GSF02: Parent chưa có con
  it('[GSF02] Parent chưa có con trả về danh sách rỗng', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('Phụ huynh chưa có con học tại trường');
    console.log('\n[GSF02] message:', res.body.message, 'data length:', res.body.data.length);
  });

  // GSF03: Học sinh chưa được phân lớp
  it('[GSF03] Học sinh chưa được phân lớp', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].fees).toHaveLength(0);
    expect(res.body.data[0].message).toBe('Học sinh chưa được phân lớp');
    console.log('\n[GSF03] message:', res.body.data[0].message, 'fees:', res.body.data[0].fees.length);
  });

  // GSF04: Chọn lớp academic_year mới nhất
  it('[GSF04] Chọn lớp academic_year mới nhất cho học sinh', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);

    const oldClass = await createTestClass(school._id, classAge._id, teacher._id, { academic_year: '2023-2024', class_name: 'Lớp Cũ' });
    const newClass = await createTestClass(school._id, classAge._id, teacher._id, { academic_year: '2024-2025', class_name: 'Lớp Mới' });
    await createStudentClass(student._id, oldClass._id, 0);
    await createStudentClass(student._id, newClass._id, 0);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    expect(res.body.data[0].class.academic_year).toBe('2024-2025');
    expect(res.body.data[0].class.class_name).toBe('Lớp Mới');
    console.log('\n[GSF04] class:', res.body.data[0].class.class_name, 'year:', res.body.data[0].class.academic_year);
  });

  // GSF05: Fee pending, không overdue, không late fee
  it('[GSF05] Fee pending, không overdue, không late fee', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id, { academic_year: '2024-2025' });
    const studentClass = await createStudentClass(student._id, cls._id, 10); // 10% discount
    const fee = await createFee(school._id, { amount: 200000, late_fee_type: 'none' });
    const dueDate = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    await createClassFee(cls._id, fee._id, dueDate);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    const feeItem = res.body.data[0].fees[0];
    expect(feeItem.status).toBe('pending');
    expect(feeItem.base_amount).toBe('200000');
    expect(feeItem.amount_with_late_fee).toBe('200000');
    expect(feeItem.late_fee.is_applied).toBe(false);
    console.log('\n[GSF05] status:', feeItem.status, 'base:', feeItem.base_amount, 'late_applied:', feeItem.late_fee.is_applied);
  });

  // GSF06: Overdue, áp dụng late fee fixed khi chưa có invoice
  it('[GSF06] Overdue áp dụng late fee fixed khi chưa có invoice', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 100000, late_fee_type: 'fixed', late_fee_value: 20000 });
    const dueDate = new Date(Date.now() - 3 * 24 * 3600 * 1000); // overdue
    await createClassFee(cls._id, fee._id, dueDate);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    const feeItem = res.body.data[0].fees[0];
    expect(feeItem.status).toBe('overdue');
    expect(feeItem.amount_with_late_fee).toBe('120000');
    expect(feeItem.late_fee.applied_amount).toBe('20000');
    expect(feeItem.late_fee.is_applied).toBe(true);
    console.log('\n[GSF06] status:', feeItem.status, 'total:', feeItem.amount_with_late_fee, 'late:', feeItem.late_fee.applied_amount);
  });

  // GSF07: Invoice đã thanh toán -> status paid
  it('[GSF07] Invoice đã thanh toán trả về status paid', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 80000, late_fee_type: 'none' });
    const dueDate = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    // invoice paid
    await Invoice.create({
      student_class_id: studentClass._id,
      class_fee_id: classFee._id,
      amount_due: mongoose.Types.Decimal128.fromString('80000'),
      due_date: dueDate,
      discount: 0,
      status: 1
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    const feeItem = res.body.data[0].fees[0];
    expect(feeItem.status).toBe('paid');
    expect(feeItem.status_text).toBe('Đã thanh toán');
    console.log('\n[GSF07] status:', feeItem.status, 'text:', feeItem.status_text);
  });

  // GSF08: Invoice pending đã có late_fee_amount lưu sẵn
  it('[GSF08] Invoice pending nhưng đã có late_fee_amount', async () => {
    const school = await createTestSchool();
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 100000, late_fee_type: 'percentage', late_fee_value: 10 });
    const dueDate = new Date(Date.now() - 2 * 24 * 3600 * 1000); // overdue
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    await Invoice.create({
      student_class_id: studentClass._id,
      class_fee_id: classFee._id,
      amount_due: mongoose.Types.Decimal128.fromString('110000'),
      due_date: dueDate,
      discount: 0,
      status: 0,
      late_fee_amount: mongoose.Types.Decimal128.fromString('10000'),
      late_fee_applied_at: new Date()
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app).get('/parent/fees');

    expect(res.status).toBe(200);
    const feeItem = res.body.data[0].fees[0];
    expect(feeItem.status).toBe('overdue');
    expect(feeItem.late_fee.applied_amount).toBe('10000');
    expect(feeItem.amount_with_late_fee).toBe('110000');
    expect(feeItem.late_fee.is_applied).toBe(true);
    console.log('\n[GSF08] status:', feeItem.status, 'total:', feeItem.amount_with_late_fee, 'late:', feeItem.late_fee.applied_amount);
  });
});
