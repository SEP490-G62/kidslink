// Script tạo database mẫu bằng MongoDB Shell
// Chạy: mongo <database_name> seed-sample-mongo-shell.js
// hoặc: mongosh <database_name> seed-sample-mongo-shell.js

// Xóa dữ liệu cũ (nếu cần) - Bỏ comment để xóa dữ liệu cũ trước khi tạo mới
// db.users.deleteMany({});
// db.schools.deleteMany({});
// db.teachers.deleteMany({});
// db.healthcarestaffs.deleteMany({});
// db.classages.deleteMany({});
// db.classes.deleteMany({});
// db.students.deleteMany({});
// db.parents.deleteMany({});
// db.parentstudents.deleteMany({});
// db.studentclasses.deleteMany({});

// Lưu ý: Tên collection trong MongoDB được Mongoose tự động chuyển đổi:
// - User -> users
// - School -> schools  
// - Teacher -> teachers
// - HealthCareStaff -> healthcarestaffs
// - ClassAge -> classages
// - Class -> classes
// - Student -> students
// - Parent -> parents
// - ParentStudent -> parentstudents
// - StudentClass -> studentclasses

// Hàm tạo ObjectId
function getObjectId() {
  return ObjectId();
}

// Hàm tạo ngày ngẫu nhiên trong khoảng 3-6 tuổi
function getRandomDOB() {
  const today = new Date();
  const minAge = 3;
  const maxAge = 6;
  const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const birthDate = new Date(today);
  birthDate.setFullYear(today.getFullYear() - randomAge);
  birthDate.setMonth(Math.floor(Math.random() * 12));
  birthDate.setDate(Math.floor(Math.random() * 28) + 1);
  return birthDate;
}

// Hàm tạo ngày bắt đầu và kết thúc năm học
function getAcademicYearDates() {
  const startDate = new Date();
  startDate.setMonth(8); // Tháng 9
  startDate.setDate(1);
  startDate.setFullYear(2024);
  
  const endDate = new Date(startDate);
  endDate.setFullYear(2025);
  endDate.setMonth(5); // Tháng 6
  endDate.setDate(30);
  
  return { startDate, endDate };
}

// Tạo 2 schools
const school1Id = getObjectId();
const school2Id = getObjectId();

const schools = [
  {
    _id: school1Id,
    school_name: "Trường Mầm Non Hoa Hồng",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    phone: "0281234567",
    email: "hoahong@school.edu.vn",
    logo_url: "https://example.com/logo1.png",
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: school2Id,
    school_name: "Trường Mầm Non Bình Minh",
    address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
    phone: "0287654321",
    email: "binhminh@school.edu.vn",
    logo_url: "https://example.com/logo2.png",
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.schools.insertMany(schools);
print("Đã tạo 2 schools");

// Tạo ClassAge cho mỗi school (4 độ tuổi: 3, 4, 5, 6)
const classAges = [];
const classAgeIds = {};

[3, 4, 5, 6].forEach(age => {
  const ageNames = {
    3: "Nhà trẻ",
    4: "Mẫu giáo bé",
    5: "Mẫu giáo nhỡ",
    6: "Mẫu giáo lớn"
  };
  
  const school1AgeId = getObjectId();
  const school2AgeId = getObjectId();
  
  classAges.push(
    {
      _id: school1AgeId,
      age: age,
      age_name: ageNames[age],
      school_id: school1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: school2AgeId,
      age: age,
      age_name: ageNames[age],
      school_id: school2Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );
  
  if (!classAgeIds[school1Id]) classAgeIds[school1Id] = [];
  if (!classAgeIds[school2Id]) classAgeIds[school2Id] = [];
  classAgeIds[school1Id].push(school1AgeId);
  classAgeIds[school2Id].push(school2AgeId);
});

db.classages.insertMany(classAges);
print("Đã tạo ClassAge cho các schools");

// Tạo Users và Teachers cho mỗi school (5 teachers)
const teachers = [];
const teacherUserIds = {};

[school1Id, school2Id].forEach((schoolId, schoolIndex) => {
  const schoolTeachers = [];
  for (let i = 1; i <= 5; i++) {
    const userId = getObjectId();
    const teacherId = getObjectId();
    
    const user = {
      _id: userId,
      full_name: `Giáo viên ${i} - Trường ${schoolIndex + 1}`,
      username: `teacher${schoolIndex + 1}_${i}`,
      password_hash: "$2b$10$exampleHash", // Hash mẫu, cần thay bằng hash thật
      role: "teacher",
      avatar_url: "https://example.com/avatar.png",
      status: 1,
      email: `teacher${schoolIndex + 1}_${i}@school.edu.vn`,
      phone_number: `090${schoolIndex}${i}${i}${i}${i}${i}${i}${i}`,
      school_id: schoolId,
      address: `Địa chỉ giáo viên ${i}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const teacher = {
      _id: teacherId,
      qualification: "Đại học Sư phạm",
      major: "Giáo dục Mầm non",
      experience_years: Math.floor(Math.random() * 10) + 1,
      note: `Giáo viên có kinh nghiệm ${i} năm`,
      user_id: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    db.users.insertOne(user);
    teachers.push(teacher);
    schoolTeachers.push(teacherId);
  }
  teacherUserIds[schoolId] = schoolTeachers;
});

db.teachers.insertMany(teachers);
print("Đã tạo 10 teachers (5 mỗi school)");

// Tạo Nutrition Staff cho mỗi school (1 nutrition staff)
const nutritionUsers = [];

[school1Id, school2Id].forEach((schoolId, schoolIndex) => {
  const userId = getObjectId();
  const user = {
    _id: userId,
    full_name: `Nhân viên Dinh dưỡng - Trường ${schoolIndex + 1}`,
    username: `nutrition${schoolIndex + 1}`,
    password_hash: "$2b$10$exampleHash",
    role: "nutrition_staff",
    avatar_url: "https://example.com/avatar.png",
    status: 1,
    email: `nutrition${schoolIndex + 1}@school.edu.vn`,
    phone_number: `091${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}`,
    school_id: schoolId,
    address: `Địa chỉ nhân viên dinh dưỡng`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  nutritionUsers.push(user);
});

db.users.insertMany(nutritionUsers);
print("Đã tạo 2 nutrition staff (1 mỗi school)");

// Tạo Healthcare Staff cho mỗi school (1 healthcare staff)
const healthcareStaffs = [];

[school1Id, school2Id].forEach((schoolId, schoolIndex) => {
  const userId = getObjectId();
  const healthcareStaffId = getObjectId();
  
  const user = {
    _id: userId,
    full_name: `Nhân viên Y tế - Trường ${schoolIndex + 1}`,
    username: `healthcare${schoolIndex + 1}`,
    password_hash: "$2b$10$exampleHash",
    role: "health_care_staff",
    avatar_url: "https://example.com/avatar.png",
    status: 1,
    email: `healthcare${schoolIndex + 1}@school.edu.vn`,
    phone_number: `092${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}${schoolIndex}`,
    school_id: schoolId,
    address: `Địa chỉ nhân viên y tế`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const healthcareStaff = {
    _id: healthcareStaffId,
    qualification: "Y sĩ",
    major: "Y tế học đường",
    experience_years: Math.floor(Math.random() * 10) + 1,
    note: "Nhân viên y tế có kinh nghiệm",
    user_id: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.users.insertOne(user);
  healthcareStaffs.push(healthcareStaff);
});

db.healthcarestaffs.insertMany(healthcareStaffs);
print("Đã tạo 2 healthcare staff (1 mỗi school)");

// Tạo Classes cho mỗi school (4 classes)
const classes = [];
const classIdsBySchool = {};

[school1Id, school2Id].forEach((schoolId, schoolIndex) => {
  const schoolClassIds = [];
  const academicYearDates = getAcademicYearDates();
  
  // Mỗi school có 4 classes, mỗi class tương ứng với 1 độ tuổi
  classAgeIds[schoolId].forEach((classAgeId, index) => {
    const classId = getObjectId();
    const teacherId = teacherUserIds[schoolId][index % 5]; // Phân bổ giáo viên
    
    const classDoc = {
      _id: classId,
      class_name: `Lớp ${String.fromCharCode(65 + index)}${schoolIndex + 1}`, // A1, B1, C1, D1 cho school1; A2, B2, C2, D2 cho school2
      academic_year: "2024-2025",
      school_id: schoolId,
      class_age_id: classAgeId,
      teacher_id: teacherId,
      teacher_id2: null,
      start_date: academicYearDates.startDate,
      end_date: academicYearDates.endDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    classes.push(classDoc);
    schoolClassIds.push(classId);
  });
  
  classIdsBySchool[schoolId] = schoolClassIds;
});

db.classes.insertMany(classes);
print("Đã tạo 8 classes (4 mỗi school)");

// Tạo Students và Parents cho mỗi class (4 students mỗi class, mỗi student có 1 parent)
const students = [];
const parents = [];
const parentStudents = [];
const studentClasses = [];

[school1Id, school2Id].forEach((schoolId, schoolIndex) => {
  classIdsBySchool[schoolId].forEach((classId, classIndex) => {
    // Tạo 4 students cho mỗi class
    for (let i = 1; i <= 4; i++) {
      const studentId = getObjectId();
      const parentUserId = getObjectId();
      const parentId = getObjectId();
      
      // Tạo Student
      const student = {
        _id: studentId,
        full_name: `Học sinh ${i} - Lớp ${String.fromCharCode(65 + classIndex)}${schoolIndex + 1}`,
        school_id: schoolId,
        dob: getRandomDOB(),
        gender: Math.floor(Math.random() * 2), // 0: male, 1: female
        avatar_url: "https://example.com/student-avatar.png",
        status: 1,
        allergy: i % 3 === 0 ? "Không có" : "", // Một số học sinh có thông tin dị ứng
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Tạo Parent User
      const parentUser = {
        _id: parentUserId,
        full_name: `Phụ huynh ${i} - Lớp ${String.fromCharCode(65 + classIndex)}${schoolIndex + 1}`,
        username: `parent${schoolIndex + 1}_${classIndex}_${i}`,
        password_hash: "$2b$10$exampleHash",
        role: "parent",
        avatar_url: "https://example.com/avatar.png",
        status: 1,
        email: `parent${schoolIndex + 1}_${classIndex}_${i}@example.com`,
        phone_number: `093${schoolIndex}${classIndex}${i}${i}${i}${i}${i}${i}`,
        school_id: schoolId,
        address: `Địa chỉ phụ huynh ${i}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Tạo Parent
      const parent = {
        _id: parentId,
        user_id: parentUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Tạo ParentStudent relationship
      const parentStudent = {
        _id: getObjectId(),
        parent_id: parentId,
        student_id: studentId,
        relationship: i % 2 === 0 ? "Bố" : "Mẹ",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Tạo StudentClass relationship
      const studentClass = {
        _id: getObjectId(),
        student_id: studentId,
        class_id: classId,
        discount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      students.push(student);
      db.users.insertOne(parentUser);
      parents.push(parent);
      parentStudents.push(parentStudent);
      studentClasses.push(studentClass);
    }
  });
});

db.students.insertMany(students);
db.parents.insertMany(parents);
db.parentstudents.insertMany(parentStudents);
db.studentclasses.insertMany(studentClasses);

print("Đã tạo students, parents và các mối quan hệ");
print(`Tổng kết:`);
print(`- Schools: 2`);
print(`- Teachers: 10 (5 mỗi school)`);
print(`- Nutrition Staff: 2 (1 mỗi school)`);
print(`- Healthcare Staff: 2 (1 mỗi school)`);
print(`- Classes: 8 (4 mỗi school)`);
print(`- Students: 32 (4 mỗi class)`);
print(`- Parents: 32 (1 mỗi student)`);
print("Hoàn thành tạo dữ liệu mẫu!");

