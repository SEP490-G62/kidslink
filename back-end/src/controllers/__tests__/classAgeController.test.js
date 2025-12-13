const { createClassAge } = require('../classAgeController');

// Mock models
jest.mock('../../models/ClassAge', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../models/School', () => ({
  findOne: jest.fn(),
}));

const ClassAge = require('../../models/ClassAge');
const User = require('../../models/User');
const School = require('../../models/School');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('createClassAge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trả về 400 nếu thiếu age hoặc age_name', async () => {
    const req = {
      body: { age: null, age_name: '' },
      user: { role: 'admin' },
    };
    const res = createMockRes();

    await createClassAge(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Thiếu thông tin bắt buộc' });
  });

  test('admin tạo classAge: tự động lấy school đầu tiên nếu không truyền school_id', async () => {
    const req = {
      body: { age: 3, age_name: 'Mẫu giáo bé' },
      user: { role: 'admin' },
    };
    const res = createMockRes();

    School.findOne.mockResolvedValue({ _id: 'school123' });
    ClassAge.findOne.mockResolvedValue(null);
    ClassAge.create.mockResolvedValue({
      _id: 'classage123',
      age: 3,
      age_name: 'Mẫu giáo bé',
      school_id: 'school123',
    });

    await createClassAge(req, res);

    expect(School.findOne).toHaveBeenCalled();
    expect(ClassAge.findOne).toHaveBeenCalledWith({ age: 3, school_id: 'school123' });
    expect(ClassAge.create).toHaveBeenCalledWith({
      age: 3,
      age_name: 'Mẫu giáo bé',
      school_id: 'school123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Tạo khối tuổi thành công',
        classAge: expect.objectContaining({ age: 3, age_name: 'Mẫu giáo bé' }),
      })
    );
  });

  test('school_admin tạo classAge: dùng school_id từ user', async () => {
    const req = {
      body: { age: 4, age_name: 'Mẫu giáo nhỡ' },
      user: { role: 'school_admin', id: 'admin123' },
    };
    const res = createMockRes();

    // getSchoolIdForAdmin dùng User.findById().select('school_id')
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'admin123', school_id: 'school999' }),
    });
    ClassAge.findOne.mockResolvedValue(null);
    ClassAge.create.mockResolvedValue({
      _id: 'classage456',
      age: 4,
      age_name: 'Mẫu giáo nhỡ',
      school_id: 'school999',
    });

    await createClassAge(req, res);

    expect(User.findById).toHaveBeenCalledWith('admin123');
    expect(ClassAge.findOne).toHaveBeenCalledWith({ age: 4, school_id: 'school999' });
    expect(ClassAge.create).toHaveBeenCalledWith({
      age: 4,
      age_name: 'Mẫu giáo nhỡ',
      school_id: 'school999',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Tạo khối tuổi thành công',
        classAge: expect.objectContaining({ age: 4, age_name: 'Mẫu giáo nhỡ' }),
      })
    );
  });

  test('trả về 400 nếu age đã tồn tại trong cùng trường', async () => {
    const req = {
      body: { age: 5, age_name: 'Mẫu giáo lớn', school_id: 'school123' },
      user: { role: 'admin' },
    };
    const res = createMockRes();

    ClassAge.findOne.mockResolvedValue({ _id: 'existingId', age: 5, school_id: 'school123' });

    await createClassAge(req, res);

    expect(ClassAge.findOne).toHaveBeenCalledWith({ age: 5, school_id: 'school123' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Khối tuổi với age=5 đã tồn tại trong trường này',
    });
  });

  test('school_admin không có school_id gắn với user -> trả về lỗi 400', async () => {
    const req = {
      body: { age: 6, age_name: 'Lớp 1' },
      user: { role: 'school_admin', id: 'adminNoSchool' },
    };
    const res = createMockRes();

    // getSchoolIdForAdmin sẽ ném lỗi nếu không có school_id
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await createClassAge(req, res);

    expect(User.findById).toHaveBeenCalledWith('adminNoSchool');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'School admin chưa được gán trường học',
    });
  });
});
