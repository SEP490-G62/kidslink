# Unit Testing Guide - KidsLink Backend

## ✅ Status: Test Infrastructure Complete & Working

### Test đã chạy thành công:

```
PASS tests/basic.test.js
  Basic API Tests
    ✓ Health check endpoint works (58 ms)
    ✓ Root endpoint works (14 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        1.934 s
```

---

## 🚀 Chạy Tests

### Chạy tất cả tests

```bash
npm test
```

### Chạy với watch mode (tự động chạy lại khi có thay đổi)

```bash
npm run test:watch
```

### Chạy với coverage report

```bash
npm run test:coverage
```

---

## 📁 Cấu trúc

```
back-end/
├── tests/
│   ├── basic.test.js          # ✅ Basic API endpoint tests (PASSING)
│   ├── setup/
│   │   ├── jest.setup.js      # ✅ MongoDB memory server setup
│   │   └── testHelpers.js     # ✅ Test utility functions
│   └── unit/                   # Thư mục cho unit tests (sẵn sàng mở rộng)
├── jest.config.js              # ✅ Jest configuration
└── package.json                # ✅ Test scripts đã thêm
```

---

## 🔧 Cấu hình Hoàn chỉnh

### Jest Config (`jest.config.js`)
```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testTimeout: 10000,
  verbose: true
}
```

### Test Scripts (`package.json`)
```json
{
  "test": "jest --forceExit",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage --forceExit"
}
```

### Test Database Strategy
- **MongoDB Memory Server**: In-memory database
- **Isolation**: Mỗi test có clean database
- **No side effects**: Không ảnh hưởng production DB
- **Fast**: Chạy trong RAM

---

## 📝 Test Lifecycle

```
1. beforeAll    → Tạo MongoDB Memory Server + Connect
2. beforeEach   → (Optional) Seed test data
3. Test runs    → Execute test case
4. afterEach    → Clean all collections (reset state)
5. afterAll     → Disconnect + Stop server
```

---

## 🛠 Test Helper Functions

File `tests/setup/testHelpers.js` cung cấp:

| Function | Usage |
|----------|-------|
| `generateToken(user)` | Tạo JWT token cho authentication |
| `createTestSchool(data)` | Tạo test school |
| `createTestUser(role, school_id)` | Tạo user với role (admin, teacher, parent, etc.) |
| `createTestTeacher(user_id, data)` | Tạo teacher profile |
| `createTestStudent(school_id, data)` | Tạo test student |
| `createTestClass(school_id, data)` | Tạo test class |
| `addStudentToClass(student_id, class_id)` | Link student vào class |

---

## 📝 Viết Test Mới

### Template cơ bản

```javascript
const request = require('supertest');
const { app } = require('../server');

describe('Feature Name Tests', () => {
  test('Should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .send({ data: 'value' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Sử dụng Test Helpers

```javascript
const request = require('supertest');
const { app } = require('../server');
const { 
  generateToken, 
  createTestSchool, 
  createTestUser 
} = require('./setup/testHelpers');

describe('Protected Endpoint Tests', () => {
  let school, user, token;

  beforeEach(async () => {
    school = await createTestSchool();
    user = await createTestUser('admin', school._id);
    token = generateToken(user);
  });

  test('Authorized user can access', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('Unauthorized user cannot access', async () => {
    const response = await request(app)
      .get('/api/protected');

    expect(response.status).toBe(401);
  });
});
```

---

## 📊 Test Cases Đã Validate

Các test case matrices đã được validate và sẵn sàng implement:

### User Management (58 test cases)
- ✅ `createUser_testcases.tsv` - 28 UTCIDs
- ✅ `getAllUsers_testcases.tsv` - 9 UTCIDs
- ✅ `updateUser_testcases.tsv` - 14 UTCIDs
- ✅ `deleteUser_testcases.tsv` - 7 UTCIDs

### Student Management (19 test cases)
- ✅ `createStudent_testcases.tsv` - 12 UTCIDs
- ✅ `deleteStudent_testcases.tsv` - 7 UTCIDs

### Class Management (12 test cases)
- ✅ `addStudentToClass_testcases.tsv` - 12 UTCIDs

### Daily Report (9 test cases)
- ✅ `checkIn_testcases.tsv` - 9 UTCIDs

**Total: 98 test cases** sẵn sàng để implement

---

## 🎯 Next Steps - Mở rộng Tests

### 1. Implement User Management Tests

Tạo file `tests/unit/user/createUser.test.js`:

```javascript
const request = require('supertest');
const { app } = require('../../../server');
const { generateToken, createTestSchool, createTestUser } = require('../../setup/testHelpers');

describe('createUser API Tests', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createTestUser('admin');
    adminToken = generateToken(admin);
  });

  // Map UTCID01 from createUser_testcases.tsv
  test('UTCID01: Admin creates admin user successfully', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'newadmin',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Admin',
        role: 'admin'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('admin');
  });

  // UTCID02, UTCID03, ... tiếp tục cho 28 test cases
});
```

### 2. Tương tự cho các modules khác

- `tests/unit/user/getAllUsers.test.js` (9 tests)
- `tests/unit/user/updateUser.test.js` (14 tests)
- `tests/unit/user/deleteUser.test.js` (7 tests)
- `tests/unit/student/createStudent.test.js` (12 tests)
- `tests/unit/student/deleteStudent.test.js` (7 tests)
- `tests/unit/class/addStudentToClass.test.js` (12 tests)
- `tests/unit/dailyReport/checkIn.test.js` (9 tests)

---

## 📦 Dependencies

Đã cài đặt:
- ✅ `jest` - Test framework
- ✅ `supertest` - HTTP assertions
- ✅ `mongodb-memory-server` - In-memory MongoDB

---

## 🐛 Troubleshooting

### Test chạy chậm lần đầu
- MongoDB Memory Server cần download binary lần đầu (~200MB)
- Lần sau sẽ nhanh hơn (binary đã cached)

### Tests timeout
```bash
# Check open handles
npm test -- --detectOpenHandles

# Increase timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

### Port conflicts
- Supertest không cần port riêng
- Sử dụng app instance trực tiếp

### MongoDB connection errors
```javascript
// Jest setup đã handle disconnect existing connections
if (mongoose.connection.readyState !== 0) {
  await mongoose.disconnect();
}
```

---

## 📊 Coverage Goals

| Module | Target |
|--------|--------|
| Controllers | > 85% |
| Models | > 90% |
| Middleware | > 75% |
| Overall | > 80% |

Xem coverage hiện tại:
```bash
npm run test:coverage
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## ✅ Checklist

- [x] Jest setup hoàn chỉnh
- [x] MongoDB Memory Server configured
- [x] Test helpers created
- [x] Basic tests passing
- [x] npm scripts added
- [x] README documentation
- [ ] User Management tests (0/58)
- [ ] Student Management tests (0/19)
- [ ] Class Management tests (0/12)
- [ ] Daily Report tests (0/9)
- [ ] CI/CD pipeline setup

---

**Status**: ✅ **Infrastructure hoàn chỉnh - Sẵn sàng viết test cases**

Để bắt đầu viết tests, tham khảo TSV files trong `docs/unittest/` và map từng UTCID thành Jest test case.
