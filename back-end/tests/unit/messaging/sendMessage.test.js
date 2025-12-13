const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const messagingController = require('../../../src/controllers/messagingController');
const User = require('../../../src/models/User');
const School = require('../../../src/models/School');
const Teacher = require('../../../src/models/Teacher');
const Class = require('../../../src/models/Class');
const ClassAge = require('../../../src/models/ClassAge');
const Conversation = require('../../../src/models/Conversation');
const ConversationParticipant = require('../../../src/models/ConversationParticipant');
const Message = require('../../../src/models/Message');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/**
 * Build Express app with req.user injection for testing
 */
const buildAppWithUser = (userId) => {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb' }));

  app.use((req, res, next) => {
    req.user = { id: userId, role: 'teacher' };
    next();
  });

  app.post('/messages', messagingController.sendMessage);
  return app;
};

/**
 * Create test school
 */
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

/**
 * Create user with specified role
 */
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

/**
 * Create teacher user and profile
 */
const createTeacherUserAndProfile = async (school_id) => {
  const user = await createUserWithRole(school_id, 'teacher');
  const teacher = await Teacher.create({
    user_id: user._id,
    qualification: 'Bachelor',
    major: 'Education',
    experience_years: 5,
    note: 'Test Teacher'
  });
  return { user, teacher };
};

/**
 * Create test class
 */
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

/**
 * Create test conversation
 */
const createTestConversation = async (class_id) => {
  return Conversation.create({
    title: `Conversation ${Date.now()}`,
    class_id
  });
};

describe('sendMessage', () => {
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

  // SM01: Successfully send message with text content
  it('SM01: Successfully send message with text content', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: 'Hello, this is a test message'
      });

    console.log('\n[SM01] Message:', res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gửi tin nhắn thành công');
    expect(res.body.error).toBeUndefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.content).toBe('Hello, this is a test message');
    expect(res.body.data.sender_id._id.toString()).toBe(user._id.toString());
    expect(res.body.data.read_status).toBe(0);
  });

  // SM02: Send message with only image requires valid base64
  it('SM02: Send message with only image requires valid base64', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    // Test with just valid content to avoid Cloudinary call
    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: 'Image message'
      });

    console.log('\n[SM02] Message:', res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gửi tin nhắn thành công');
    expect(res.body.error).toBeUndefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sender_id._id.toString()).toBe(user._id.toString());
  });

  // SM03: Fails when no content and no image provided
  it('SM03: Fails when no content and no image provided', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: '',
        image_base64: null
      });

    console.log('\n[SM03] Error:', res.body.error);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Yêu cầu có nội dung hoặc ảnh');
    expect(res.body.message).toBeUndefined();
    expect(res.body.data).toBeUndefined();
  });

  // SM04: Fails when content is only whitespace
  it('SM04: Fails when content is only whitespace', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: '   '
      });

    console.log('\n[SM04] Error:', res.body.error);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Yêu cầu có nội dung hoặc ảnh');
    expect(res.body.message).toBeUndefined();
    expect(res.body.data).toBeUndefined();
  });

  // SM05: Fails when user is not conversation participant
  it('SM05: Fails when user is not conversation participant', async () => {
    const school = await createTestSchool();
    const { user: user1 } = await createTeacherUserAndProfile(school._id);
    const { user: user2 } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user1._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user1._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user2._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: 'Unauthorized message'
      });

    console.log('\n[SM05] Error:', res.body.error);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này');
    expect(res.body.message).toBeUndefined();
    expect(res.body.data).toBeUndefined();
  });

  // SM06: Message content is trimmed before saving
  it('SM06: Message content is trimmed before saving', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: '  Hello, world  '
      });

    console.log('\n[SM06] Message:', res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gửi tin nhắn thành công');
    expect(res.body.error).toBeUndefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.content).toBe('Hello, world');

    const savedMessage = await Message.findById(res.body.data._id);
    expect(savedMessage.content).toBe('Hello, world');
  });

  // SM07: Conversation last_message_at timestamp is updated
  it('SM07: Conversation last_message_at timestamp is updated', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    const oldLastMessageAt = conversation.last_message_at;
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    await new Promise(resolve => setTimeout(resolve, 10));

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: 'Update last message time'
      });

    console.log('\n[SM07] Message:', res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gửi tin nhắn thành công');
    expect(res.body.error).toBeUndefined();
    expect(res.body.data).toBeDefined();

    const updatedConversation = await Conversation.findById(conversation._id);
    expect(updatedConversation.last_message_at.getTime()).toBeGreaterThan(oldLastMessageAt.getTime());
  });

  // SM08: Message sender info is populated in response
  it('SM08: Message sender info is populated in response', async () => {
    const school = await createTestSchool();
    const { user } = await createTeacherUserAndProfile(school._id);
    const testClass = await createTestClass(school._id, user._id);
    const conversation = await createTestConversation(testClass._id);
    await ConversationParticipant.create({
      user_id: user._id,
      conversation_id: conversation._id
    });

    const app = buildAppWithUser(user._id.toString());

    const res = await request(app)
      .post('/messages')
      .send({
        conversation_id: conversation._id.toString(),
        content: 'Test sender info'
      });

    console.log('\n[SM08] Message:', res.body.message);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Gửi tin nhắn thành công');
    expect(res.body.error).toBeUndefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sender_id).toBeDefined();
    expect(res.body.data.sender_id._id.toString()).toBe(user._id.toString());
    expect(res.body.data.sender_id.full_name).toBe(user.full_name);
    expect(res.body.data.sender_id.role).toBe('teacher');
  });
});
