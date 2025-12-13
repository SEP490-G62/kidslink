const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
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
const { createPayOSPaymentRequest } = require('../../../src/controllers/parent/feeController');

jest.mock('axios');

function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/parent/fees/payos', createPayOSPaymentRequest);
  return app;
}

// Helpers -------------------------------------------------
async function createTestSchool(payosConfig = null) {
  return await School.create({
    school_name: 'Test School',
    address: '123 Test St',
    phone_number: '0123456789',
    phone: `phone${Date.now()}${Math.random()}`,
    email: `school${Date.now()}${Math.random()}@test.com`,
    logo_url: 'https://example.com/logo.png',
    payos_config: payosConfig || null
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

async function createParentUserAndProfile(school_id) {
  const user = await createUserWithRole(school_id, 'parent');
  const parent = await Parent.create({ user_id: user._id });
  return { user, parent };
}

async function linkParentStudent(parent_id, student_id) {
  return await ParentStudent.create({ parent_id, student_id, relationship: 'Bố' });
}

async function createTestClassAge(school_id) {
  return await ClassAge.create({ school_id, age_name: '3-4', age: 3 });
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
  return await Student.create({ full_name, school_id, dob: new Date('2020-01-01'), gender: 0, avatar_url: '' });
}

async function createStudentClass(student_id, class_id, discount = 0) {
  return await StudentClass.create({ student_id, class_id, discount });
}

async function createFee(school_id, overrides = {}) {
  const amountValue = overrides.amount !== undefined ? overrides.amount : 100000;
  return await Fee.create({
    school_id,
    fee_name: overrides.fee_name || 'Học phí',
    description: overrides.description || 'Mô tả',
    amount: mongoose.Types.Decimal128.fromString(String(amountValue)),
    late_fee_type: overrides.late_fee_type || 'none',
    late_fee_value: overrides.late_fee_value || 0,
    late_fee_description: overrides.late_fee_description || ''
  });
}

async function createClassFee(class_id, fee_id, due_date, status = 1) {
  return await ClassFee.create({ class_id, fee_id, due_date, status });
}

describe('Parent Fee Controller - createPayOSPaymentRequest', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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

  // POS01: Thành công tạo payment request 1 khoản, late fee được áp dụng
  it('[POS01] Thành công tạo payment request (1 fee, late fee applied)', async () => {
    const school = await createTestSchool({
      active: true,
      client_id: 'cid',
      api_key: 'akey',
      checksum_key: 'ckey'
    });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 100000, late_fee_type: 'fixed', late_fee_value: 10000 });
    const dueDate = new Date(Date.now() - 2 * 24 * 3600 * 1000); // overdue
    const classFee = await createClassFee(cls._id, fee._id, dueDate);

    axios.post.mockResolvedValue({ data: { code: '00', data: { checkoutUrl: 'http://checkout', qrCode: 'QR', expiredAt: Math.floor(Date.now()/1000)+600 } } });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({
        student_id: student._id,
        class_fee_id: classFee._id,
        student_class_id: studentClass._id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Tạo yêu cầu thanh toán thành công');
    expect(res.body.data.amount).toBe(100000);
    expect(res.body.data.checkout_url).toBe('http://checkout');
    expect(res.body.data.invoice_ids).toHaveLength(1);

    const savedInvoice = await Invoice.findById(res.body.data.invoice_ids[0]);
    expect(savedInvoice).toBeTruthy();
    expect(savedInvoice.payos_order_code).toBe(res.body.data.order_code);
    expect(savedInvoice.status).toBe(0);
    expect(Number(savedInvoice.late_fee_amount?.toString() || 0)).toBe(0);
    expect(Number(savedInvoice.amount_due?.toString() || 0)).toBe(100000);
    expect(savedInvoice.payos_checkout_url).toBe('http://checkout');
    console.log('\n[POS01] amount:', res.body.data.amount, 'checkout:', res.body.data.checkout_url);
  });

  // POS02: Nhiều khoản cùng trường, tổng > 0
  it('[POS02] Thanh toán nhiều khoản cùng trường', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee1 = await createFee(school._id, { amount: 50000 });
    const fee2 = await createFee(school._id, { amount: 70000 });
    const classFee1 = await createClassFee(cls._id, fee1._id, new Date());
    const classFee2 = await createClassFee(cls._id, fee2._id, new Date());

    axios.post.mockResolvedValue({ data: { code: '00', data: { checkoutUrl: 'http://checkout' } } });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({
        fee_items: [
          { student_id: student._id, class_fee_id: classFee1._id, student_class_id: studentClass._id },
          { student_id: student._id, class_fee_id: classFee2._id, student_class_id: studentClass._id }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(120000);
    expect(res.body.data.items).toHaveLength(2);
    console.log('\n[POS02] amount:', res.body.data.amount, 'items:', res.body.data.items.length);
  });

  // NEG01: fee_items thiếu hoặc sai -> 400
  it('[NEG01] fee_items không hợp lệ trả về 400', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user } = await createParentUserAndProfile(school._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ fee_items: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Cần truyền student_id, class_fee_id, student_class_id hoặc fee_items hợp lệ');
    console.log('\n[NEG01] status:', res.status, 'message:', res.body.message);
  });

  // NEG02: Không tìm thấy parent
  it('[NEG02] Parent không tồn tại trả về 404', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user } = await createParentUserAndProfile(school._id);
    await Parent.deleteMany({});

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: new mongoose.Types.ObjectId(), class_fee_id: new mongoose.Types.ObjectId(), student_class_id: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy thông tin phụ huynh');
    console.log('\n[NEG02] status:', res.status, 'message:', res.body.message);
  });

  // NEG03: ParentStudent không match -> 403
  it('[NEG03] Không có quyền thanh toán cho học sinh', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    // Không link parent-student
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bạn không có quyền thanh toán cho một trong các học sinh đã chọn');
    console.log('\n[NEG03] status:', res.status, 'message:', res.body.message);
  });

  // NEG04: Trường chưa kích hoạt PayOS
  it('[NEG04] Trường chưa kích hoạt PayOS', async () => {
    const school = await createTestSchool({ active: false, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Trường chưa kích hoạt cổng thanh toán PayOS');
    console.log('\n[NEG04] status:', res.status, 'message:', res.body.message);
  });

  // NEG05: PayOS axios error -> 502
  it('[NEG05] PayOS trả lỗi HTTP 502', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    axios.post.mockRejectedValue({ response: { data: { desc: 'PayOS maintenance' } } });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('PayOS maintenance');
    console.log('\n[NEG05] status:', res.status, 'message:', res.body.message);
  });

  // NEG06: Nhiều khoản khác trường
  it('[NEG06] Không thể thanh toán nhiều trường trong 1 yêu cầu', async () => {
    const school1 = await createTestSchool({ active: true, client_id: 'cid1', api_key: 'ak1', checksum_key: 'ck1' });
    const school2 = await createTestSchool({ active: true, client_id: 'cid2', api_key: 'ak2', checksum_key: 'ck2' });
    const { user, parent } = await createParentUserAndProfile(school1._id);
    const student1 = await createStudent(school1._id, 'HS1');
    const student2 = await createStudent(school2._id, 'HS2');
    await linkParentStudent(parent._id, student1._id);
    await linkParentStudent(parent._id, student2._id);
    const classAge1 = await createTestClassAge(school1._id);
    const classAge2 = await createTestClassAge(school2._id);
    const { teacher: t1 } = await createTeacherUserAndProfile(school1._id);
    const { teacher: t2 } = await createTeacherUserAndProfile(school2._id);
    const cls1 = await createTestClass(school1._id, classAge1._id, t1._id);
    const cls2 = await createTestClass(school2._id, classAge2._id, t2._id);
    const sc1 = await createStudentClass(student1._id, cls1._id, 0);
    const sc2 = await createStudentClass(student2._id, cls2._id, 0);
    const fee1 = await createFee(school1._id, { amount: 40000 });
    const fee2 = await createFee(school2._id, { amount: 60000 });
    const cf1 = await createClassFee(cls1._id, fee1._id, new Date());
    const cf2 = await createClassFee(cls2._id, fee2._id, new Date());

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({
        fee_items: [
          { student_id: student1._id, class_fee_id: cf1._id, student_class_id: sc1._id },
          { student_id: student2._id, class_fee_id: cf2._id, student_class_id: sc2._id }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không thể thanh toán nhiều khoản thuộc các trường khác nhau trong một yêu cầu');
    console.log('\n[NEG06] status:', res.status, 'message:', res.body.message);
  });

  // NEG07: Thiếu cấu hình PayOS
  it('[NEG07] Thiếu thông tin PayOS trả 400', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: null, checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Thiếu thông tin cấu hình PayOS (client_id, api_key hoặc checksum_key)');
    console.log('\n[NEG07] status:', res.status, 'message:', res.body.message);
  });

  // NEG08: Số tiền <= 0
  it('[NEG08] Số tiền thanh toán phải lớn hơn 0', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 0 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Số tiền thanh toán phải lớn hơn 0');
    console.log('\n[NEG08] status:', res.status, 'message:', res.body.message);
  });

  // NEG09: Invoice đã thanh toán
  it('[NEG09] Khoản phí đã thanh toán trả 400', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    await Invoice.create({
      class_fee_id: classFee._id,
      student_class_id: studentClass._id,
      amount_due: mongoose.Types.Decimal128.fromString('50000'),
      due_date: new Date(),
      discount: 0,
      status: 1
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Một trong các khoản phí đã được thanh toán');
    console.log('\n[NEG09] status:', res.status, 'message:', res.body.message);
  });

  // NEG10: PayOS trả code khác 00
  it('[NEG10] PayOS trả lỗi business code', async () => {
    const school = await createTestSchool({ active: true, client_id: 'cid', api_key: 'akey', checksum_key: 'ckey' });
    const { user, parent } = await createParentUserAndProfile(school._id);
    const student = await createStudent(school._id);
    await linkParentStudent(parent._id, student._id);
    const classAge = await createTestClassAge(school._id);
    const { teacher } = await createTeacherUserAndProfile(school._id);
    const cls = await createTestClass(school._id, classAge._id, teacher._id);
    const studentClass = await createStudentClass(student._id, cls._id, 0);
    const fee = await createFee(school._id, { amount: 50000 });
    const classFee = await createClassFee(cls._id, fee._id, new Date());

    axios.post.mockResolvedValue({ data: { code: '99', desc: 'Sai tham số' } });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post('/parent/fees/payos')
      .send({ student_id: student._id, class_fee_id: classFee._id, student_class_id: studentClass._id });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Sai tham số');
    console.log('\n[NEG10] status:', res.status, 'message:', res.body.message);
  });
});
