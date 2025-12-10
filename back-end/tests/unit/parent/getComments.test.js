const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { getComments } = require('../../../src/controllers/parent/commentsController');
const { User, Post, PostComment } = require('../../../src/models');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = userPayload; next(); });
  app.get('/parent/posts/:postId/comments', getComments);
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
  return await Post.create({ content, status: 'approved', user_id, class_id: null });
}

describe('Parent - getComments', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      Post.deleteMany({}),
      PostComment.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  it('[GCM07] Lấy danh sách comment rỗng khi chưa có dữ liệu', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .get(`/parent/posts/${post._id}/comments`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comments).toHaveLength(0);
    expect(res.body.data.pagination.currentPage).toBe(1);
    expect(res.body.data.pagination.totalPages).toBe(0);
    expect(res.body.data.pagination.totalComments).toBe(0);
  });

  it('[GCM08] Lấy comment có replies nhiều cấp (đệ quy)', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const topComment = await PostComment.create({
      contents: 'C1',
      post_id: post._id,
      user_id: user._id,
      parent_comment_id: null,
      create_at: new Date(Date.now() - 3000)
    });

    const reply1 = await PostComment.create({
      contents: 'C1-1',
      post_id: post._id,
      user_id: user._id,
      parent_comment_id: topComment._id,
      create_at: new Date(Date.now() - 2000)
    });

    await PostComment.create({
      contents: 'C1-1-1',
      post_id: post._id,
      user_id: user._id,
      parent_comment_id: reply1._id,
      create_at: new Date(Date.now() - 1000)
    });

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .get(`/parent/posts/${post._id}/comments`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    const comments = res.body.data.comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].contents).toBe('C1');
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies[0].contents).toBe('C1-1');
    expect(comments[0].replies[0].replies).toHaveLength(1);
    expect(comments[0].replies[0].replies[0].contents).toBe('C1-1-1');
  });

  it('[GCM09] Pagination hoạt động đúng với nhiều top-level comments', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    await PostComment.create({ contents: 'C1', post_id: post._id, user_id: user._id, parent_comment_id: null });
    await PostComment.create({ contents: 'C2', post_id: post._id, user_id: user._id, parent_comment_id: null });
    await PostComment.create({ contents: 'C3', post_id: post._id, user_id: user._id, parent_comment_id: null });

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .get(`/parent/posts/${post._id}/comments`)
      .query({ page: 2, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.currentPage).toBe(2);
    expect(res.body.data.pagination.totalPages).toBe(2);
    expect(res.body.data.pagination.totalComments).toBe(3);
    expect(res.body.data.comments).toHaveLength(1);
  });
});
