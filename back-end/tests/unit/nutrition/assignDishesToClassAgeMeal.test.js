/**
 * Unit tests for assignDishesToClassAgeMeal controller
 * Tests assigning dishes to class age meals with various scenarios
 * Route: POST /api/nutrition/class-age-meals/assign
 */

const request = require('supertest');
const express = require('express');
const School = require('../../../src/models/School');
const User = require('../../../src/models/User');
const { Dish, ClassAge, ClassAgeMeal, Meal, WeekDay, DishesClassAgeMeal } = require('../../../src/models');
const { assignDishesToClassAgeMeal } = require('../../../src/controllers/nutritionController');

// ========== Helper Functions ==========
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
    role: role,
    school_id: school_id,
    status: 1
  });
};

const createMeal = async (mealName = 'Sáng') => {
  return Meal.create({
    meal: mealName
  });
};

const createWeekDay = async (day = 'Thứ 2') => {
  return WeekDay.create({
    day_of_week: day
  });
};

const createClassAge = async (school_id, age = 3, ageName = '3-4 tuổi') => {
  return ClassAge.create({
    age: age,
    age_name: ageName,
    school_id: school_id
  });
};

const createDish = async (school_id, meal_id, dishName = 'Phở bò') => {
  const uniqueSuffix = Date.now().toString() + Math.random().toString(16).slice(2);
  return Dish.create({
    dish_name: dishName + uniqueSuffix,
    description: 'Món ăn ngon',
    meal_type: meal_id,
    school_id: school_id
  });
};

const buildAppWithUser = (userPayload) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = userPayload;
    next();
  });
  app.post('/class-age-meals/assign', assignDishesToClassAgeMeal);
  return app;
};

// ========== Setup and Teardown ==========
beforeEach(async () => {
  await Promise.all([
    School.deleteMany({}),
    User.deleteMany({}),
    Dish.deleteMany({}),
    ClassAge.deleteMany({}),
    ClassAgeMeal.deleteMany({}),
    Meal.deleteMany({}),
    WeekDay.deleteMany({}),
    DishesClassAgeMeal.deleteMany({})
  ]);
});

// ========== Test Cases ==========
describe('POST /class-age-meals/assign - assignDishesToClassAgeMeal', () => {

  // ========== Normal Cases ==========
  
  it('ADCAM01: Nutrition staff successfully assigns dishes to class age meal', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const weekday = await createWeekDay('Thứ 2');
    const classAge = await createClassAge(school._id, 3, '3-4 tuổi');
    const dish1 = await createDish(school._id, meal._id, 'Phở');
    const dish2 = await createDish(school._id, meal._id, 'Bánh mì');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const assignData = {
      class_age_id: classAge._id.toString(),
      meal_id: meal._id.toString(),
      weekday_id: weekday._id.toString(),
      date: '2025-01-15',
      dish_ids: [dish1._id.toString(), dish2._id.toString()]
    };

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send(assignData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.classAgeMeal).toBeDefined();
    expect(res.body.dishes).toHaveLength(2);
    expect(res.body.dishes.map(d => d._id.toString())).toContain(dish1._id.toString());
    expect(res.body.dishes.map(d => d._id.toString())).toContain(dish2._id.toString());
  });

  it('ADCAM02: Creates ClassAgeMeal if not exists', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Trưa');
    const weekday = await createWeekDay('Thứ 3');
    const classAge = await createClassAge(school._id, 4, '4-5 tuổi');
    const dish = await createDish(school._id, meal._id, 'Cơm gà');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const beforeCount = await ClassAgeMeal.countDocuments();

    const assignData = {
      class_age_id: classAge._id.toString(),
      meal_id: meal._id.toString(),
      weekday_id: weekday._id.toString(),
      date: '2025-01-16',
      dish_ids: [dish._id.toString()]
    };

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send(assignData)
      .expect(200);

    const afterCount = await ClassAgeMeal.countDocuments();
    expect(afterCount).toBe(beforeCount + 1);
    expect(res.body.success).toBe(true);
  });

  it('ADCAM03: Updates existing ClassAgeMeal with new dishes', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Chiều');
    const weekday = await createWeekDay('Thứ 4');
    const classAge = await createClassAge(school._id, 5, '5-6 tuổi');
    const dish1 = await createDish(school._id, meal._id, 'Chè');
    const dish2 = await createDish(school._id, meal._id, 'Bánh bao');
    const dish3 = await createDish(school._id, meal._id, 'Sữa');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const date = '2025-01-17';

    // First assignment
    await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: date,
        dish_ids: [dish1._id.toString(), dish2._id.toString()]
      })
      .expect(200);

    // Second assignment with different dishes
    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: date,
        dish_ids: [dish2._id.toString(), dish3._id.toString()]
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.dishes).toHaveLength(2);
    const dishIds = res.body.dishes.map(d => d._id.toString());
    expect(dishIds).toContain(dish2._id.toString());
    expect(dishIds).toContain(dish3._id.toString());
    expect(dishIds).not.toContain(dish1._id.toString());
  });

  it('ADCAM04: Assigns empty dish array (removes all dishes)', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const weekday = await createWeekDay('Thứ 5');
    const classAge = await createClassAge(school._id, 3, '3-4 tuổi');
    const dish = await createDish(school._id, meal._id, 'Phở');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const date = '2025-01-18';

    // First assign a dish
    await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: date,
        dish_ids: [dish._id.toString()]
      })
      .expect(200);

    // Then assign empty array
    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: date,
        dish_ids: []
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.dishes).toHaveLength(0);
  });

  it('ADCAM05: Assigns multiple dishes from same school', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Trưa');
    const weekday = await createWeekDay('Thứ 6');
    const classAge = await createClassAge(school._id, 4, '4-5 tuổi');
    
    const dishes = await Promise.all([
      createDish(school._id, meal._id, 'Món 1'),
      createDish(school._id, meal._id, 'Món 2'),
      createDish(school._id, meal._id, 'Món 3'),
      createDish(school._id, meal._id, 'Món 4')
    ]);

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: '2025-01-19',
        dish_ids: dishes.map(d => d._id.toString())
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.dishes).toHaveLength(4);
  });

  // ========== Abnormal Cases ==========

  it('ADCAM06: Missing class_age_id returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        meal_id: '507f1f77bcf86cd799439011',
        weekday_id: '507f1f77bcf86cd799439012',
        date: '2025-01-20',
        dish_ids: []
      })
      .expect(400);

    expect(res.body.error).toContain('Thiếu tham số yêu cầu');
  });

  it('ADCAM07: Missing meal_id returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        weekday_id: '507f1f77bcf86cd799439012',
        date: '2025-01-20',
        dish_ids: []
      })
      .expect(400);

    expect(res.body.error).toContain('Thiếu tham số yêu cầu');
  });

  it('ADCAM08: Missing weekday_id returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        meal_id: '507f1f77bcf86cd799439012',
        date: '2025-01-20',
        dish_ids: []
      })
      .expect(400);

    expect(res.body.error).toContain('Thiếu tham số yêu cầu');
  });

  it('ADCAM09: Missing date returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        meal_id: '507f1f77bcf86cd799439012',
        weekday_id: '507f1f77bcf86cd799439013',
        dish_ids: []
      })
      .expect(400);

    expect(res.body.error).toContain('Thiếu tham số yêu cầu');
  });

  it('ADCAM10: dish_ids not array returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        meal_id: '507f1f77bcf86cd799439012',
        weekday_id: '507f1f77bcf86cd799439013',
        date: '2025-01-20',
        dish_ids: 'not-an-array'
      })
      .expect(400);

    expect(res.body.error).toContain('Thiếu tham số yêu cầu');
  });

  it('ADCAM11: Invalid class_age_id returns 400', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const weekday = await createWeekDay('Thứ 2');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: '2025-01-20',
        dish_ids: []
      })
      .expect(400);

    expect(res.body.error).toContain('Tham chiếu không hợp lệ');
  });

  it('ADCAM12: Dish from different school returns 400', async () => {
    const school1 = await createTestSchool('School 1');
    const school2 = await createTestSchool('School 2');
    const nutritionStaff = await createUserWithRole(school1._id, 'nutrition_staff');
    const meal = await createMeal('Trưa');
    const weekday = await createWeekDay('Thứ 3');
    const classAge = await createClassAge(school1._id, 3, '3-4 tuổi');
    const dishFromSchool2 = await createDish(school2._id, meal._id, 'Món khác trường');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school1._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: '2025-01-20',
        dish_ids: [dishFromSchool2._id.toString()]
      })
      .expect(400);

    expect(res.body.error).toContain('không hợp lệ hoặc không thuộc trường học của bạn');
  });

  it('ADCAM13: User without school_id returns 403', async () => {
    const nutritionStaff = await createUserWithRole(null, 'nutrition_staff');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: null
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: '507f1f77bcf86cd799439011',
        meal_id: '507f1f77bcf86cd799439012',
        weekday_id: '507f1f77bcf86cd799439013',
        date: '2025-01-20',
        dish_ids: []
      })
      .expect(403);

    expect(res.body.error).toContain('Không tìm thấy school_id của user');
  });

  // ========== Boundary Cases ==========

  it('ADCAM14: Assigns single dish', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Sáng');
    const weekday = await createWeekDay('Thứ 2');
    const classAge = await createClassAge(school._id, 3, '3-4 tuổi');
    const dish = await createDish(school._id, meal._id, 'Phở');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: '2025-01-21',
        dish_ids: [dish._id.toString()]
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.dishes).toHaveLength(1);
  });

  it('ADCAM15: Assigns dishes with past date', async () => {
    const school = await createTestSchool();
    const nutritionStaff = await createUserWithRole(school._id, 'nutrition_staff');
    const meal = await createMeal('Trưa');
    const weekday = await createWeekDay('Thứ 4');
    const classAge = await createClassAge(school._id, 4, '4-5 tuổi');
    const dish = await createDish(school._id, meal._id, 'Cơm');

    const app = buildAppWithUser({
      id: nutritionStaff._id.toString(),
      role: 'nutrition_staff',
      school_id: school._id.toString()
    });

    const res = await request(app)
      .post('/class-age-meals/assign')
      .send({
        class_age_id: classAge._id.toString(),
        meal_id: meal._id.toString(),
        weekday_id: weekday._id.toString(),
        date: '2020-01-01',
        dish_ids: [dish._id.toString()]
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.classAgeMeal).toBeDefined();
  });
});
