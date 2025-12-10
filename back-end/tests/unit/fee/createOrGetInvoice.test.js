const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const {
  Fee,
  ClassFee,
  Invoice,
  StudentClass,
  Student,
  Class: ClassModel,
  School,
  User,
  Teacher,
  ClassAge,
} = require('../../../src/models');
const { createOrGetInvoice } = require('../../../src/controllers/feeController');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/fees/:id/classes/:classFeeId/students/:studentClassId/invoice', createOrGetInvoice);
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

async function createStudent(school_id) {
  return await Student.create({
    full_name: 'Bé A',
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

describe('Fee Controller - createOrGetInvoice', () => {
  beforeEach(async () => {
    await Promise.all([
      Fee.deleteMany({}),
      ClassFee.deleteMany({}),
      Invoice.deleteMany({}),
      StudentClass.deleteMany({}),
      Student.deleteMany({}),
      ClassModel.deleteMany({}),
      School.deleteMany({}),
      User.deleteMany({}),
      Teacher.deleteMany({}),
      ClassAge.deleteMany({}),
    ]);
  });

  // IV01: Tạo invoice mới không trễ hạn, không late fee
  it('[IV01] Tạo invoice mới không trễ hạn, không late fee', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 100000, late_fee_type: 'none' });
    const dueDate = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Invoice đã được tạo/cập nhật');
    expect(res.body.data.base_amount).toBe('100000.00');
    expect(res.body.data.late_fee_amount).toBe('0.00');
    expect(res.body.data.total_amount).toBe('100000.00');
    expect(res.body.data.is_late_fee_applied).toBe(false);
    expect(res.body.data.status).toBe(0);
    console.log('\n[IV01] total:', res.body.data.total_amount, 'late_fee:', res.body.data.late_fee_amount);
  });

  // IV02: Tạo invoice với discount 10%
  it('[IV02] Tạo invoice với discount 10%', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 10); // 10%
    const fee = await createFee(school._id, { amount: 200000, late_fee_type: 'none' });
    const dueDate = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.base_amount).toBe('180000.00');
    expect(res.body.data.late_fee_amount).toBe('0.00');
    expect(res.body.data.total_amount).toBe('180000.00');
    expect(res.body.data.discount).toBe(10);
    console.log('\n[IV02] base:', res.body.data.base_amount, 'discount:', res.body.data.discount);
  });

  // IV03: Tạo invoice quá hạn -> áp dụng fixed late fee
  it('[IV03] Tạo invoice quá hạn, áp dụng fixed late fee', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 100000, late_fee_type: 'fixed', late_fee_value: 20000 });
    const dueDate = new Date(Date.now() - 5 * 24 * 3600 * 1000); // quá hạn
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.base_amount).toBe('100000.00');
    expect(res.body.data.late_fee_amount).toBe('20000.00');
    expect(res.body.data.total_amount).toBe('120000.00');
    expect(res.body.data.is_late_fee_applied).toBe(true);
    expect(res.body.data.status).toBe(2);
    console.log('\n[IV03] total:', res.body.data.total_amount, 'late_fee:', res.body.data.late_fee_amount);
  });

  // IV04: Invoice đã tồn tại, quá hạn, chưa có late fee -> áp dụng late fee
  it('[IV04] Invoice tồn tại, quá hạn, áp dụng late fee một lần', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000, late_fee_type: 'fixed', late_fee_value: 10000 });
    const dueDate = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    // Invoice đã tồn tại, chưa late fee
    await Invoice.create({
      student_class_id: studentClass._id,
      class_fee_id: classFee._id,
      amount_due: mongoose.Types.Decimal128.fromString('50000'),
      due_date: dueDate,
      discount: 0,
      status: 0,
      late_fee_amount: null,
    });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.late_fee_amount).toBe('10000.00');
    expect(res.body.data.total_amount).toBe('60000.00');
    expect(res.body.data.is_late_fee_applied).toBe(true);
    expect(res.body.data.status).toBe(2);
    console.log('\n[IV04] total:', res.body.data.total_amount, 'late_fee:', res.body.data.late_fee_amount);
  });

  // IV05: ID không hợp lệ
  it('[IV05] ID không hợp lệ trả về 400', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });

    const res = await request(app)
      .post('/fees/invalid/classes/invalid/students/invalid/invoice')
      .send();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('ID không hợp lệ');
    console.log('\n[IV05] status:', res.status, 'message:', res.body.message);
  });

  // IV06: Fee không tồn tại
  it('[IV06] Fee không tồn tại trả về 404', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fakeFeeId = new mongoose.Types.ObjectId();
    const classFee = await createClassFee(cls._id, fakeFeeId, new Date());

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fakeFeeId}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy phí');
    console.log('\n[IV06] status:', res.status, 'message:', res.body.message);
  });

  // IV07: ClassFee không tồn tại
  it('[IV07] ClassFee không tồn tại trả về 404', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const student = await createStudent(school._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const fakeClassFeeId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${fakeClassFeeId}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy thông tin lớp áp dụng phí');
    console.log('\n[IV07] status:', res.status, 'message:', res.body.message);
  });

  // IV08: StudentClass không tồn tại
  it('[IV08] StudentClass không tồn tại trả về 404', async () => {
    const school = await createTestSchool();
    const admin = await createUserWithRole(school._id, 'admin');
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());
    const fakeStudentClassId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${fakeStudentClassId}/invoice`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy thông tin học sinh trong lớp');
    console.log('\n[IV08] status:', res.status, 'message:', res.body.message);
  });

  // IV09: School_admin thao tác phí thuộc trường khác
  it('[IV09] School_admin không được thao tác phí trường khác', async () => {
    const school1 = await createTestSchool();
    const school2 = await School.create({
      school_name: 'School 2',
      address: '456 Test St',
      phone_number: '0987654321',
      phone: `phone${Date.now()}${Math.random()}`,
      email: `school2${Date.now()}${Math.random()}@test.com`,
      logo_url: 'https://example.com/logo2.png'
    });
    const schoolAdmin = await createUserWithRole(school1._id, 'school_admin');
    const admin = await createUserWithRole(school2._id, 'admin');
    const classAge = await createTestClassAge(school2._id);
    const { teacher } = await createTeacherUserAndProfile(school2._id);
    const cls = await createTestClass(school2._id, classAge._id, teacher._id);
    const student = await createStudent(school2._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school2._id, { amount: 70000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
    const res = await request(app)
      .post(`/fees/${fee._id}/classes/${classFee._id}/students/${studentClass._id}/invoice`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bạn không có quyền thao tác trên phí thuộc trường khác');
    console.log('\n[IV09] status:', res.status, 'message:', res.body.message);
  });
});
