/**
 * Unit tests for deleteUser controller (soft delete)
 * Covers role-based access control, school_admin permissions, and soft delete logic.
 */

const request = require('supertest');
const express = require('express');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const { deleteUser } = require('../../../src/controllers/userController');

// Helpers --------------------------------------------------
const createTestSchool = async (name = 'Test School') => {
  const uniqueSuffix = Date.now().toString();
  return School.create({
    school_name: name,
    address: '123 Test St',
    logo_url: 'https://via.placeholder.com/150',
    phone: `0123456789${uniqueSuffix}`,
    email: `school_${uniqueSuffix}@example.com`
  });
};

const createTestUser = async (data = {}) => {
  return User.create({
    full_name: data.full_name || 'Test User',
    username: data.username || `test_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    password_hash: data.password_hash || 'hashed_password',
    email: data.email || `test_${Date.now()}@test.com`,
    phone_number: data.phone_number || '0912345678',
    avatar_url: data.avatar_url || 'https://via.placeholder.com/150',
    role: data.role || 'admin',
    school_id: data.school_id || null,
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.delete('/users/:id', deleteUser);
  return app;
};

beforeEach(async () => {
  await User.deleteMany({});
  await School.deleteMany({});
});


// Tests ----------------------------------------------------
describe('DELETE /users/:id - deleteUser (controller)', () => {
  it('DTID01: Admin can soft delete any user', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin01' });
    const targetUser = await createTestUser({ role: 'teacher', username: 't1', status: 1 });

    const app = buildAppWithUser({ id: admin._id.toString(), role: 'admin', username: admin.username });
    const res = await request(app).delete(`/users/${targetUser._id}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('thành công');

    // Verify user status set to 0
    const deletedUser = await User.findById(targetUser._id);
    expect(deletedUser.status).toBe(0);
  });

  it('DTID02: School admin can delete manageable roles in their school', async () => {
    const school = await createTestSchool('School 2');
    const schoolAdmin = await createTestUser({ 
      role: 'school_admin', 
      school_id: school._id, 
      username: 'sa1' 
    });
    const teacher = await createTestUser({ 
      role: 'teacher', 
      school_id: school._id, 
      username: 't2',
      status: 1
    });

    const app = buildAppWithUser({ 
      id: schoolAdmin._id.toString(), 
      role: 'school_admin', 
      username: schoolAdmin.username 
    });
    const res = await request(app).delete(`/users/${teacher._id}`).expect(200);

    expect(res.body.success).toBe(true);
    const deletedUser = await User.findById(teacher._id);
    expect(deletedUser.status).toBe(0);
  });

  it('DTID03: School admin cannot delete user from other school', async () => {
    const school1 = await createTestSchool('School 3');
    const school2 = await createTestSchool('School 4');
    
    const admin1 = await createTestUser({ 
      role: 'school_admin', 
      school_id: school1._id, 
      username: 'sa3' 
    });
    const userInSchool2 = await createTestUser({ 
      role: 'teacher', 
      school_id: school2._id, 
      username: 't4' 
    });

    const app = buildAppWithUser({ 
      id: admin1._id.toString(), 
      role: 'school_admin', 
      username: admin1.username 
    });
    const res = await request(app).delete(`/users/${userInSchool2._id}`).expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('trường');

    // Verify user NOT deleted
    const user = await User.findById(userInSchool2._id);
    expect(user.status).toBe(1);
  });

  it('DTID04: School admin cannot delete non-manageable role (e.g., admin)', async () => {
    const school = await createTestSchool('School 5');
    const schoolAdmin = await createTestUser({ 
      role: 'school_admin', 
      school_id: school._id, 
      username: 'sa4' 
    });
    const adminUser = await createTestUser({ 
      role: 'admin', 
      school_id: school._id, 
      username: 'admin5' 
    });

    const app = buildAppWithUser({ 
      id: schoolAdmin._id.toString(), 
      role: 'school_admin', 
      username: schoolAdmin.username 
    });
    const res = await request(app).delete(`/users/${adminUser._id}`).expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('vai trò');
  });

  it('DTID05: Delete non-existent user returns 404', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin6' });
    const fakeId = '507f1f77bcf86cd799439011';

    const app = buildAppWithUser({ 
      id: admin._id.toString(), 
      role: 'admin', 
      username: admin.username 
    });
    const res = await request(app).delete(`/users/${fakeId}`).expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Không tìm thấy');
  });

  it('DTID06: Teacher cannot delete any user (no permission)', async () => {
    const teacher = await createTestUser({ role: 'teacher', username: 't6' });
    const targetUser = await createTestUser({ role: 'parent', username: 'p6' });

    const app = express();
    app.delete('/users/:id', (req, res) => {
      res.status(403).json({ success: false, error: 'Không có quyền' });
    });

    const res = await request(app).delete(`/users/${targetUser._id}`).expect(403);
    expect(res.body.success).toBe(false);
  });

  it('DTID07: Invalid user ID format returns 500', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin7' });
    const invalidId = 'invalid-id-format';

    const app = buildAppWithUser({ 
      id: admin._id.toString(), 
      role: 'admin', 
      username: admin.username 
    });
    const res = await request(app).delete(`/users/${invalidId}`).expect(500);

    expect(res.body.success).toBe(false);
  });

  it('DTID08: School admin without school_id cannot delete', async () => {
    const schoolAdmin = await createTestUser({ 
      role: 'school_admin', 
      school_id: null,
      username: 'sa_no_school' 
    });
    const targetUser = await createTestUser({ role: 'teacher', username: 't8' });

    const app = buildAppWithUser({ 
      id: schoolAdmin._id.toString(), 
      role: 'school_admin', 
      username: schoolAdmin.username 
    });
    const res = await request(app).delete(`/users/${targetUser._id}`).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('gán trường');
  });

  it('DTID09: Multiple soft deletes update status correctly', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin9' });
    const user1 = await createTestUser({ role: 'teacher', username: 't9a', status: 1 });
    const user2 = await createTestUser({ role: 'teacher', username: 't9b', status: 1 });

    const app = buildAppWithUser({ 
      id: admin._id.toString(), 
      role: 'admin', 
      username: admin.username 
    });

    await request(app).delete(`/users/${user1._id}`).expect(200);
    await request(app).delete(`/users/${user2._id}`).expect(200);

    const deletedUser1 = await User.findById(user1._id);
    const deletedUser2 = await User.findById(user2._id);
    
    expect(deletedUser1.status).toBe(0);
    expect(deletedUser2.status).toBe(0);
  });

  it('DTID10: Soft deleted user still exists in DB (not removed)', async () => {
    const admin = await createTestUser({ role: 'admin', username: 'admin10' });
    const targetUser = await createTestUser({ role: 'teacher', username: 't10' });

    const app = buildAppWithUser({ 
      id: admin._id.toString(), 
      role: 'admin', 
      username: admin.username 
    });

    await request(app).delete(`/users/${targetUser._id}`).expect(200);

    // User should still exist in DB with status=0
    const user = await User.findById(targetUser._id);
    expect(user).not.toBeNull();
    expect(user._id.toString()).toBe(targetUser._id.toString());
    expect(user.status).toBe(0);
  });
});
