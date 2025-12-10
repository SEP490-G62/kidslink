/**
 * Unit tests for createDish controller
 * Route: POST /nutrition/dishes (controller only)
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const Dish = require('../../../src/models/Dish');
const Meal = require('../../../src/models/Meal');
const { createDish } = require('../../../src/controllers/nutritionController');

// Helpers --------------------------------------------------
const createTestSchool = async (name = 'Test School') => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return School.create({
    school_name: name,
    address: '123 Test St',
    logo_url: 'https://via.placeholder.com/150',
    phone: `0123456789${uniqueSuffix}`,
    email: `school_${uniqueSuffix}@example.com`
  });
};

const createUserWithRole = async (school_id, role = 'nutrition_staff') => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return User.create({
    full_name: `${role} User`,
    username: `${role}_${uniqueSuffix}`,
    password_hash: 'hashed_password',
    email: `${role}_${uniqueSuffix}@test.com`,
    phone_number: `091234${uniqueSuffix}`,
    avatar_url: 'https://via.placeholder.com/150',
    role,
    school_id,
    status: 1
  });
};

const createMeal = async (mealName = 'Sáng') => Meal.create({ meal: mealName });

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/dishes', createDish);
  return app;
};

// Setup ----------------------------------------------------
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    Dish.deleteMany({}),
    Meal.deleteMany({})
  ]);
});

describe('POST /dishes - createDish', () => {
  // Normal cases
  it('CD01: Creates dish successfully with valid data', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Trưa');

    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const payload = {
      dish_name: 'Phở bò',
      description: 'Món phở bò thơm ngon',
      meal_type: meal._id.toString()
    };

    const res = await request(app)
      .post('/dishes')
      .send(payload)
      .expect(201);

    expect(res.body.dish_name).toBe(payload.dish_name);
    expect(res.body.description).toBe(payload.description);
    expect(res.body.meal_type).toBeDefined();
    expect(res.body.meal_type._id.toString()).toBe(meal._id.toString());
    expect(res.body.school_id.toString()).toBe(school._id.toString());
  });

  it('CD02: Returns populated meal_type object', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Chiều');

    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({
        dish_name: 'Bánh mì',
        description: 'Bánh mì kẹp',
        meal_type: meal._id.toString()
      })
      .expect(201);

    expect(res.body.meal_type.meal).toBe('Chiều');
  });

  // Abnormal cases
  it('CD03: Missing dish_name returns 400', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({ description: 'desc', meal_type: meal._id.toString() })
      .expect(400);

    expect(res.body.error).toContain('Thiếu dish_name');
  });

  it('CD04: Missing description returns 400', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: 'Món', meal_type: meal._id.toString() })
      .expect(400);

    expect(res.body.error).toContain('Thiếu dish_name');
  });

  it('CD05: Missing meal_type returns 400', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: 'Món', description: 'desc' })
      .expect(400);

    expect(res.body.error).toContain('Thiếu dish_name');
  });

  it('CD06: meal_type not found returns 400', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: 'Món', description: 'desc', meal_type: '507f1f77bcf86cd799439011' })
      .expect(400);

    expect(res.body.error).toContain('meal_type không hợp lệ');
  });

  it('CD07: meal_type invalid ObjectId returns 400', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: 'Món', description: 'desc', meal_type: 'not-an-objectid' })
      .expect(400);

    expect(res.body.error).toContain('meal_type không đúng định dạng ObjectId');
  });

  it('CD08: User without school_id returns 403', async () => {
    const staff = await createUserWithRole(null, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: null });

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: 'Món', description: 'desc', meal_type: meal._id.toString() })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy school_id');
  });

  // Boundary cases
  it('CD09: Creates dish with very long name and description', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const longName = 'A'.repeat(200);
    const longDesc = 'B'.repeat(500);

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: longName, description: longDesc, meal_type: meal._id.toString() })
      .expect(201);

    expect(res.body.dish_name).toBe(longName);
    expect(res.body.description).toBe(longDesc);
  });

  it('CD10: Accepts dish_name with special characters', async () => {
    const school = await createTestSchool();
    const staff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const app = buildAppWithUser({ id: staff._id.toString(), role: 'nutrition_staff', school_id: school._id.toString() });

    const name = 'Bún chả Hà Nội @#!';

    const res = await request(app)
      .post('/dishes')
      .send({ dish_name: name, description: 'desc', meal_type: meal._id.toString() })
      .expect(201);

    expect(res.body.dish_name).toBe(name);
  });
});
