const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const messagingController = require('../../../src/controllers/messagingController');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const Teacher = require('../../../src/models/Teacher');
const Class = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Conversation = require('../../../src/models/Conversation');
const ConversationParticipant = require('../../../src/models/ConversationParticipant');
const Message = require('../../../src/models/Message');

/**
 * Build Express app with req.user injection
 */
const buildAppWithUser = (userId) => {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use((req, res, next) => {
    req.user = { id: userId, role: 'teacher' };
    next();
  });
  app.get('/messages/:conversation_id', messagingController.getMessages);
  return app;
};

const createTestSchool = async () => {
  const phone = `${Date.now()}`;
  const email = `school_${Date.now()}@test.com`;
  return School.create({
    school_name: `Test School ${Date.now()}`,
    phone,
    email,
    address: 'Test Address',
    district: 'Test District',
    logo_url: 'https://example.com/logo.png',
    status: 1
  });
};

const createUserWithRole = async (school_id, role = 'teacher') => {
  const username = `user_${Date.now()}`;
  const email = `${Date.now()}@test.com`;
  return User.create({
    username,
    email,
    password: 'Test@12345',
    full_name: 'Test User',
    phone: `${Date.now()}`,
    role,
    school_id,
    status: 1,
    avatar_url: 'https://example.com/avatar.jpg'
  });
};

const createTeacherUserAndProfile = async (school_id) => {
  const user = await createUserWithRole(school_id, 'teacher');
  await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Education',
    experience_years: 3,
    note: 'Test Teacher'
  });
  return { user };
};

const createTestClass = async (school_id, teacher_id) => {
  const classAge = await ClassAge.create({
    class_age_name: `Age ${Date.now()}`,
    age_name: `Age Group ${Date.now()}`,
    age: 3,
    school_id,
    min_age: 3,
    max_age: 4,
    status: 1
  });

  return Class.create({
    class_name: `Class ${Date.now()}`,
    class_age_id: classAge._id,
    teacher_id,
    school_id,
    academic_year: 2024,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    status: 1
  });
};

const createTestConversation = async (class_id) => {
  return Conversation.create({
    title: `Conversation ${Date.now()}`,
    class_id
  });
};

describe('getMessages', () => {
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      ClassAge.deleteMany({}),
      Conversation.deleteMany({}),
      ConversationParticipant.deleteMany({}),
      Message.deleteMany({})
    ]);
  });

  // GM01: Returns messages for participant ordered oldest to newest
  it('GM01: Returns messages for participant ordered oldest to newest', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user._id, conversation_id: conversation._id });

    await Message.create([
      { content: 'msg3', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-03T00:00:00Z') },
      { content: 'msg1', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-01T00:00:00Z') },
      { content: 'msg2', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-02T00:00:00Z') }
    ]);

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}`);

    console.log('\n[GM01] status:', res.status, 'total:', res.body.pagination?.total, 'first:', res.body.messages?.[0]?.content, 'last:', res.body.messages?.[2]?.content);
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(3);
    expect(res.body.messages[0].content).toBe('msg1');
    expect(res.body.messages[1].content).toBe('msg2');
    expect(res.body.messages[2].content).toBe('msg3');
    expect(res.body.pagination.total).toBe(3);
  });

  // GM02: Pagination limit applies
  it('GM02: Pagination limit applies', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user._id, conversation_id: conversation._id });

    await Message.create([
      { content: 'm1', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-01T00:00:00Z') },
      { content: 'm2', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-02T00:00:00Z') },
      { content: 'm3', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-03T00:00:00Z') }
    ]);

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}?page=1&limit=2`);

    console.log('\n[GM02] status:', res.status, 'page:', res.body.pagination?.page, 'msgs:', res.body.messages?.map(m => m.content));
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    // After sort desc and reverse, page 1 returns the newest two: m2, m3
    expect(res.body.messages[0].content).toBe('m2');
    expect(res.body.messages[1].content).toBe('m3');
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.pages).toBe(2);
  });

  // GM03: Pagination page 2 returns remaining
  it('GM03: Pagination page 2 returns remaining', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user._id, conversation_id: conversation._id });

    await Message.create([
      { content: 'm1', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-01T00:00:00Z') },
      { content: 'm2', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-02T00:00:00Z') },
      { content: 'm3', conversation_id: conversation._id, sender_id: user._id, send_at: new Date('2024-01-03T00:00:00Z') }
    ]);

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}?page=2&limit=2`);

    console.log('\n[GM03] status:', res.status, 'page:', res.body.pagination?.page, 'msgs:', res.body.messages?.map(m => m.content));
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    // Page 2 should return the oldest remaining message
    expect(res.body.messages[0].content).toBe('m1');
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.pages).toBe(2);
  });

  // GM04: Forbidden when user not participant
  it('GM04: Forbidden when user not participant', async () => {
    const school = await createTestSchool();
    const { user: user1 } = await createTeacherUserAndProfile(school._id);
    const { user: user2 } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user1._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user1._id, conversation_id: conversation._id });

    const app = buildAppWithUser(user2._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}`);

    console.log('\n[GM04] status:', res.status, 'error:', res.body.error);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Bạn không có quyền truy cập cuộc trò chuyện này');
    expect(res.body.messages).toBeUndefined();
  });

  // GM05: Invalid conversation id format returns 500
  it('GM05: Invalid conversation id format returns 500', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get('/messages/invalid-id');

    console.log('\n[GM05] status:', res.status, 'error:', res.body.error);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Lỗi khi lấy danh sách tin nhắn');
  });

  // GM06: Populates sender info
  it('GM06: Populates sender info', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user._id, conversation_id: conversation._id });

    await Message.create({
      content: 'hello',
      conversation_id: conversation._id,
      sender_id: user._id,
      send_at: new Date('2024-01-01T00:00:00Z')
    });

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}`);

    console.log('\n[GM06] status:', res.status, 'sender:', res.body.messages?.[0]?.sender_id);
    expect(res.status).toBe(200);
    expect(res.body.messages[0].sender_id.full_name).toBe(user.full_name);
    expect(res.body.messages[0].sender_id.role).toBe('teacher');
    expect(res.body.messages[0].sender_id.avatar_url).toBe(user.avatar_url);
  });

  // GM07: Returns empty list when no messages
  it('GM07: Returns empty list when no messages', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({ user_id: user._id, conversation_id: conversation._id });

    const app = buildAppWithUser(user._id.toString());
    const res = await request(app).get(`/messages/${conversation._id.toString()}`);

    console.log('\n[GM07] status:', res.status, 'total:', res.body.pagination?.total, 'msgs:', res.body.messages?.length);
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.pages).toBe(0);
  });
});
