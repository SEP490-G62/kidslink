const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const School = require('../../src/models/School');
const Student = require('../../src/models/Student');
const Teacher = require('../../src/models/Teacher');
const ClassModel = require('../../src/models/Class');
const StudentClass = require('../../src/models/StudentClass');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/**
 * Generate JWT token for testing
 * @param {string|object} userIdOrUser - User ID (string) or User object
 * @param {string} role - User role (optional if userIdOrUser is object)
 * @param {string} schoolId - School ID (optional)
 */
const generateToken = (userIdOrUser, role = null, schoolId = null) => {
  let payload;
  
  if (typeof userIdOrUser === 'object' && userIdOrUser._id) {
    // User object passed
    payload = {
      id: userIdOrUser._id,
      role: userIdOrUser.role,
      username: userIdOrUser.username
    };
    if (userIdOrUser.school_id) {
      payload.school_id = userIdOrUser.school_id.toString();
    }
  } else {
    // User ID and role passed as separate parameters
    payload = {
      id: userIdOrUser,
      role: role || 'admin',
      username: `test_user_${userIdOrUser}`
    };
    if (schoolId) {
      payload.school_id = schoolId.toString();
    }
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Create a test school
 */
const createTestSchool = async (data = {}) => {
  const school = await School.create({
    school_name: data.school_name || 'Test School',
    address: data.address || '123 Test St',
    phone_number: data.phone_number || '0123456789',
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
  return school;
};

/**
 * Create a test user
 */
const createTestUser = async (role = 'admin', school_id = null) => {
  const timestamp = Date.now();
  const hashedPassword = await bcrypt.hash('Password@123', 10);
  
  const user = await User.create({
    username: `test_${role}_${timestamp}`,
    password: hashedPassword,
    email: `test_${role}_${timestamp}@test.com`,
    phone_number: `098${timestamp.toString().slice(-7)}`,
    full_name: `Test ${role}`,
    date_of_birth: new Date('1990-01-01'),
    address: '123 Test St',
    role: role,
    school_id: school_id,
    status: 1
  });
  
  return user;
};

/**
 * Create a test teacher
 */
const createTestTeacher = async (user_id, data = {}) => {
  const teacher = await Teacher.create({
    user_id: user_id,
    qualification: data.qualification || 'Bachelor',
    major: data.major || 'Education',
    experience_years: data.experience_years || 5,
    note: data.note || 'Test teacher',
    status: data.status !== undefined ? data.status : 1
  });
  return teacher;
};

/**
 * Create a test student
 */
const createTestStudent = async (school_id, data = {}) => {
  const timestamp = Date.now();
  const student = await Student.create({
    full_name: data.full_name || `Test Student ${timestamp}`,
    date_of_birth: data.date_of_birth || new Date('2015-01-01'),
    gender: data.gender || 'Male',
    address: data.address || '123 Test St',
    school_id: school_id,
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
  return student;
};

/**
 * Create a test class
 */
const createTestClass = async (school_id, data = {}) => {
  const timestamp = Date.now();
  const cls = await ClassModel.create({
    class_name: data.class_name || `Test Class ${timestamp}`,
    age: data.age || 5,
    academic_year: data.academic_year || '2025-2026',
    school_id: school_id,
    status: data.status !== undefined ? data.status : 1,
    ...data
  });
  return cls;
};

/**
 * Add student to class
 */
const addStudentToClass = async (student_id, class_id) => {
  const studentClass = await StudentClass.create({
    student_id: student_id,
    class_id: class_id,
    discount: 0
  });
  return studentClass;
};

module.exports = {
  generateToken,
  createTestSchool,
  createTestUser,
  createTestTeacher,
  createTestStudent,
  createTestClass,
  addStudentToClass
};
