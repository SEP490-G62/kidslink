const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { Class: ClassModel, School, User, Teacher, ClassAge } = require('../../../src/models');
const { updateClass } = require('../../../src/controllers/classController');

// Helper function để tạo Express app với req.user được inject
function buildAppWithUser(userPayload) {
	const app = express();
	app.use(express.json());
	app.use((req, res, next) => {
		req.user = userPayload;
		next();
	});
	app.put('/classes/:id', updateClass);
	return app;
}

// Helper functions
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
		role: role,
		school_id: school_id,
		avatar_url: 'https://example.com/avatar.png'
	});
}

async function createTeacherUserAndProfile(school_id) {
	const user = await createUserWithRole(school_id, 'teacher');
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

describe('Class Controller - updateClass', () => {
	beforeEach(async () => {
		await Promise.all([
			ClassModel.deleteMany({}),
			School.deleteMany({}),
			User.deleteMany({}),
			Teacher.deleteMany({}),
			ClassAge.deleteMany({})
		]);
	});

	// UC01: Admin cập nhật lớp thành công
	it('[UC01] Admin cập nhật class_name thành công', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher } = await createTeacherUserAndProfile(school._id);
		const cls = await createTestClass(school._id, classAge._id, teacher._id);

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ class_name: 'Lớp B1' });

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('Cập nhật thành công');
		expect(res.body.data.class_name).toBe('Lớp B1');
		console.log('\n[UC01] message:', res.body.message, 'class_name:', res.body.data.class_name);
	});

	// UC02: School_admin cập nhật lớp thành công
	it('[UC02] School_admin cập nhật academic_year thành công', async () => {
		const school = await createTestSchool();
		const schoolAdmin = await createUserWithRole(school._id, 'school_admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher } = await createTeacherUserAndProfile(school._id);
		const cls = await createTestClass(school._id, classAge._id, teacher._id);

		const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ academic_year: '2025-2026' });

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('Cập nhật thành công');
		expect(res.body.data.academic_year).toBe('2025-2026');
		console.log('\n[UC02] message:', res.body.message, 'academic_year:', res.body.data.academic_year);
	});

	// UC03: ID không hợp lệ
	it('[UC03] ID không hợp lệ trả về lỗi', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put('/classes/invalid-id')
			.send({ class_name: 'Lớp B1' });

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('ID không hợp lệ');
		console.log('\n[UC03] status:', res.status, 'message:', res.body.message);
	});

	// UC04: Lớp không tồn tại
	it('[UC04] Lớp không tồn tại trả về 404', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const fakeId = new mongoose.Types.ObjectId();

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${fakeId}`)
			.send({ class_name: 'Lớp B1' });

		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Không tìm thấy lớp');
		console.log('\n[UC04] status:', res.status, 'message:', res.body.message);
	});

	// UC05: School_admin không có quyền chỉnh sửa lớp thuộc trường khác
	it('[UC05] School_admin không có quyền chỉnh sửa lớp thuộc trường khác', async () => {
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
		const classAge = await createTestClassAge(school2._id);
		const { teacher } = await createTeacherUserAndProfile(school2._id);
		const cls = await createTestClass(school2._id, classAge._id, teacher._id);

		const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ class_name: 'Lớp B1' });

		expect(res.status).toBe(403);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Bạn không có quyền chỉnh sửa lớp thuộc trường khác');
		console.log('\n[UC05] status:', res.status, 'message:', res.body.message);
	});

	// UC06: School_admin cập nhật với teacher thuộc trường khác
	it('[UC06] School_admin cập nhật với teacher thuộc trường khác', async () => {
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
		const classAge = await createTestClassAge(school1._id);
		const { teacher: teacher1 } = await createTeacherUserAndProfile(school1._id);
		const { teacher: teacher2 } = await createTeacherUserAndProfile(school2._id);
		const cls = await createTestClass(school1._id, classAge._id, teacher1._id);

		const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ teacher_id: teacher2._id });

		expect(res.status).toBe(403);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Giáo viên chính không thuộc trường của bạn');
		console.log('\n[UC06] status:', res.status, 'message:', res.body.message);
	});

	// UC07: School_admin cập nhật teacher_id2 thuộc trường khác
	it('[UC07] School_admin cập nhật teacher_id2 thuộc trường khác', async () => {
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
		const classAge = await createTestClassAge(school1._id);
		const { teacher: teacher1 } = await createTeacherUserAndProfile(school1._id);
		const { teacher: teacher2 } = await createTeacherUserAndProfile(school2._id);
		const cls = await createTestClass(school1._id, classAge._id, teacher1._id);

		const app = buildAppWithUser({ id: schoolAdmin._id.toString(), role: 'school_admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ teacher_id2: teacher2._id });

		expect(res.status).toBe(403);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Giáo viên phụ không thuộc trường của bạn');
		console.log('\n[UC07] status:', res.status, 'message:', res.body.message);
	});

	// UC08: Cập nhật tên lớp trùng với lớp khác trong cùng năm học
	it('[UC08] Cập nhật tên lớp trùng với lớp khác trong cùng năm học', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
		const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    
		// Tạo 2 lớp
		const cls1 = await createTestClass(school._id, classAge._id, teacher1._id, { class_name: 'Lớp A1' });
		await createTestClass(school._id, classAge._id, teacher2._id, { class_name: 'Lớp B1' });

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls1._id}`)
			.send({ class_name: 'Lớp B1' }); // Trùng với cls2

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Đã tồn tại lớp "Lớp B1" trong năm học 2024-2025');
		console.log('\n[UC08] status:', res.status, 'message:', res.body.message);
	});

	// UC09: Cập nhật teacher đã có lớp khác trong cùng năm học
	it('[UC09] Cập nhật teacher đã có lớp khác trong cùng năm học', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
		const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
    
		// Teacher1 có lớp A1, teacher2 có lớp B1
		const cls1 = await createTestClass(school._id, classAge._id, teacher1._id, { class_name: 'Lớp A1' });
		await createTestClass(school._id, classAge._id, teacher2._id, { class_name: 'Lớp B1' });

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls1._id}`)
			.send({ teacher_id: teacher2._id }); // Teacher2 đã có lớp B1

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toBe('Giáo viên chính đã có lớp trong năm học 2024-2025');
		console.log('\n[UC09] status:', res.status, 'message:', res.body.message);
	});

	// UC10: Cập nhật nhiều trường cùng lúc
	it('[UC10] Cập nhật nhiều trường cùng lúc thành công', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher } = await createTeacherUserAndProfile(school._id);
		const cls = await createTestClass(school._id, classAge._id, teacher._id);

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({
				class_name: 'Lớp C1 Updated',
				academic_year: '2025-2026'
			});

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('Cập nhật thành công');
		expect(res.body.data.class_name).toBe('Lớp C1 Updated');
		expect(res.body.data.academic_year).toBe('2025-2026');
		console.log('\n[UC10] message:', res.body.message, 'class_name:', res.body.data.class_name, 'year:', res.body.data.academic_year);
	});

	// UC11: Cập nhật teacher_id2 thành công
	it('[UC11] Cập nhật teacher_id2 thành công', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher: teacher1 } = await createTeacherUserAndProfile(school._id);
		const { teacher: teacher2 } = await createTeacherUserAndProfile(school._id);
		const cls = await createTestClass(school._id, classAge._id, teacher1._id);

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ teacher_id2: teacher2._id });

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('Cập nhật thành công');
		expect(res.body.data.teacher_id2).toBeDefined();
		expect(res.body.data.teacher_id2._id.toString()).toBe(teacher2._id.toString());
		console.log('\n[UC11] message:', res.body.message, 'teacher_id2:', res.body.data.teacher_id2._id);
	});

	// UC12: Cập nhật sang năm học mới (teacher có thể có lớp khác năm cũ)
	it('[UC12] Cập nhật sang năm học mới cho phép teacher có lớp khác năm cũ', async () => {
		const school = await createTestSchool();
		const admin = await createUserWithRole(school._id, 'admin');
		const classAge = await createTestClassAge(school._id);
		const { teacher } = await createTeacherUserAndProfile(school._id);
    
		// Teacher có lớp năm 2024-2025
		const cls = await createTestClass(school._id, classAge._id, teacher._id, { 
			class_name: 'Lớp A1',
			academic_year: '2024-2025'
		});

		const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin' });
		const res = await request(app)
			.put(`/classes/${cls._id}`)
			.send({ academic_year: '2025-2026' }); // Chuyển sang năm mới

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('Cập nhật thành công');
		expect(res.body.data.academic_year).toBe('2025-2026');
		console.log('\n[UC12] message:', res.body.message, 'academic_year:', res.body.data.academic_year);
	});
});
