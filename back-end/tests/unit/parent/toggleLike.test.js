const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { toggleLike } = require('../../../src/controllers/parent/likesController');
const { User, Post, PostLike } = require('../../../src/models');

function buildApp(userPayload) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = userPayload; next(); });
  app.post('/parent/posts/:postId/like', toggleLike);
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

describe('Parent - toggleLike', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      Post.deleteMany({}),
      PostLike.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  it('[GLK01] Like bài post thành công (chưa like trước đó)', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${post._id}/like`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isLiked).toBe(true);
    expect(res.body.data.likeCount).toBe(1);

    const count = await PostLike.countDocuments({ post_id: post._id });
    expect(count).toBe(1);
  });

  it('[GLK02] Toggle like lần 2 sẽ unlike (isLiked=false, likeCount giảm)', async () => {
    const user = await createTestUser('parent');
    const post = await createTestPost(user._id);

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    await request(app).post(`/parent/posts/${post._id}/like`).send();
    const res = await request(app).post(`/parent/posts/${post._id}/like`).send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isLiked).toBe(false);
    expect(res.body.data.likeCount).toBe(0);

    const count = await PostLike.countDocuments({ post_id: post._id });
    expect(count).toBe(0);
  });

  it('[GLK03] Like post không tồn tại trả về 404', async () => {
    const user = await createTestUser('parent');
    const fakePostId = new mongoose.Types.ObjectId();

    const app = buildApp({ id: user._id.toString(), role: 'parent' });
    const res = await request(app)
      .post(`/parent/posts/${fakePostId}/like`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Không tìm thấy bài viết');
  });
});
