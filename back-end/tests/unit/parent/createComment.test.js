const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { createComment, createCommentValidators } = require('../../../src/controllers/parent/commentsController');
const { User, Post, PostComment } = require('../../../src/models');

// Build express app with auth middleware
function buildAppWithUser(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/parent/posts/:postId/comments', createCommentValidators, createComment);
  return app;
}

async function createTestUser(role = 'parent') {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return await User.create({
    full_name: `User ${suffix}`,
    username: `user_${suffix}`,
    email: `user_${suffix}@test.com`,
    password_hash: 'hashed',
    role,
    avatar_url: 'https://example.com/avatar.png',
    status: 1
  });
}

async function createTestPost(user_id, content = 'Nội dung bài viết') {
  return await Post.create({
    content,
    status: 'approved',
    user_id,
    class_id: null
  });
}

describe('Parent Comments Controller - createComment', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      Post.deleteMany({}),
      PostComment.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  it('[GCM01] Tạo comment mới cho post thành công', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/comments`)
      .send({ contents: 'Bình luận mới' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contents).toBe('Bình luận mới');
    expect(res.body.data.post_id.toString()).toBe(post._id.toString());
    expect(res.body.data.parent_comment_id).toBeNull();
    // populated user info
    expect(res.body.data.user_id.full_name).toBe(user.full_name);
  });

  it('[GCM02] Tạo reply cho comment cha thành công', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);
    const parentComment = await PostComment.create({
      contents: 'Comment cha',
      post_id: post._id,
      user_id: user._id,
      parent_comment_id: null
    });

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/comments`)
      .send({ contents: 'Trả lời', parent_comment_id: parentComment._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contents).toBe('Trả lời');
    expect(res.body.data.parent_comment_id._id.toString()).toBe(parentComment._id.toString());
  });

  it('[GCM03] Post không tồn tại trả về 404', async () => {
    const user = await createTestUser('parent');
    const fakePostId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${fakePostId}/comments`)
      .send({ contents: 'Bình luận' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy bài viết');
  });

  it('[GCM04] parent_comment_id không tồn tại trả về 404', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);
    const fakeCommentId = new mongoose.Types.ObjectId();

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/comments`)
      .send({ contents: 'Trả lời', parent_comment_id: fakeCommentId.toString() });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy comment cha');
  });

  it('[GCM05] Thiếu contents trả về lỗi validation 400', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/comments`)
      .send({ contents: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0].msg).toBe('Nội dung comment là bắt buộc');
  });

  it('[GCM06] parent_comment_id không phải ObjectId hợp lệ trả về 400', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildAppWithUser({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/comments`)
      .send({ contents: 'Trả lời', parent_comment_id: 'not-a-mongoid' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
