require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/database');

// Import models
const User = require('../src/models/User');
const School = require('../src/models/School');
const ClassAge = require('../src/models/ClassAge');
const Class = require('../src/models/Class');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');
const Parent = require('../src/models/Parent');
const ParentStudent = require('../src/models/ParentStudent');
const StudentClass = require('../src/models/StudentClass');
const HealthCareStaff = require('../src/models/HealthCareStaff');

// Hàm tạo tên ngẫu nhiên
const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly'];
const lastNames = ['Van', 'Thi', 'Minh', 'Thi', 'Duc', 'Thi', 'Anh', 'Thi', 'Quang', 'Thi', 'Hai', 'Thi', 'Ba', 'Thi'];
const middleNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

function getRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
  return `${firstName} ${lastName} ${middleName}`;
}

function getRandomPhone(prefix = '09') {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${num}`;
}

function getRandomEmail(username) {
  return `${username}@example.com`;
}

// Hàm tạo ngày sinh ngẫu nhiên cho độ tuổi
function getRandomDOB(age) {
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

// Mật khẩu chung cho tất cả user: "123456"
const COMMON_PASSWORD_HASH = bcrypt.hashSync('123456', 10);

async function seedData() {
  try {
    // Kết nối database
    await connectDB();
    console.log('✅ Đã kết nối database');

    // Xóa dữ liệu cũ (tùy chọn - comment nếu không muốn xóa)
    await ParentStudent.deleteMany({});
    await StudentClass.deleteMany({});
    await Student.deleteMany({});
    await Parent.deleteMany({});
    await HealthCareStaff.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await ClassAge.deleteMany({});
    await School.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ');

    const schools = [];
    const allClassAges = [];
    const allClasses = [];
    const allTeachers = [];
    const allStudents = [];
    const allParents = [];
    const allHealthCareStaff = [];
    const allUsers = [];

    // Tạo 2 schools
    for (let s = 1; s <= 2; s++) {
      const school = await School.create({
        school_name: `Trường Mầm Non KidsLink ${s}`,
        address: `${s * 100} Đường Nguyễn Văn A, Quận ${s}, TP.HCM`,
        phone: `028${1000000 + s}`,
        email: `school${s}@kidslink.vn`,
        logo_url: `https://picsum.photos/seed/school${s}/300`,
        status: 1,
        qr_data: `QR_SCHOOL_${s}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });
      schools.push(school);
      console.log(`✅ Đã tạo school ${s}: ${school.school_name}`);

      // Tạo school admin cho mỗi school
      const schoolAdminUser = await User.create({
        full_name: `Quản lý Trường ${s}`,
        username: `school${s}_admin`,
        password_hash: COMMON_PASSWORD_HASH,
        role: 'school_admin',
        avatar_url: `https://picsum.photos/seed/school${s}admin/200`,
        status: 1,
        email: `admin${s}@kidslink.vn`,
        phone_number: getRandomPhone('08'),
        school_id: school._id
      });
      allUsers.push(schoolAdminUser);

      // Tạo 8 teachers cho mỗi school
      const schoolTeachers = [];
      for (let t = 1; t <= 8; t++) {
        const teacherUser = await User.create({
          full_name: `Giáo viên ${getRandomName()}`,
          username: `school${s}_teacher${t}`,
          password_hash: COMMON_PASSWORD_HASH,
          role: 'teacher',
          avatar_url: `https://picsum.photos/seed/school${s}teacher${t}/200`,
          status: 1,
          email: getRandomEmail(`school${s}_teacher${t}`),
          phone_number: getRandomPhone('09'),
          school_id: school._id
        });
        allUsers.push(teacherUser);

        const teacher = await Teacher.create({
          qualification: ['Cử nhân Giáo dục Mầm non', 'Thạc sĩ Giáo dục', 'Cao đẳng Sư phạm'][Math.floor(Math.random() * 3)],
          major: ['Giáo dục Mầm non', 'Tâm lý học Trẻ em', 'Âm nhạc', 'Thể dục'][Math.floor(Math.random() * 4)],
          experience_years: Math.floor(Math.random() * 10) + 1,
          note: `Giáo viên lớp ${t}`,
          user_id: teacherUser._id
        });
        schoolTeachers.push(teacher);
        allTeachers.push(teacher);
      }
      console.log(`✅ Đã tạo 8 teachers cho school ${s}`);

      // Tạo 1 health care staff cho mỗi school
      const healthCareUser = await User.create({
        full_name: `Nhân viên Y tế ${getRandomName()}`,
        username: `school${s}_healthcare`,
        password_hash: COMMON_PASSWORD_HASH,
        role: 'health_care_staff',
        avatar_url: `https://picsum.photos/seed/school${s}healthcare/200`,
        status: 1,
        email: getRandomEmail(`school${s}_healthcare`),
        phone_number: getRandomPhone('09'),
        school_id: school._id
      });
      allUsers.push(healthCareUser);

      const healthCareStaff = await HealthCareStaff.create({
        qualification: ['Cử nhân Điều dưỡng', 'Y sĩ', 'Điều dưỡng Trung cấp'][Math.floor(Math.random() * 3)],
        major: 'Nhi khoa',
        experience_years: Math.floor(Math.random() * 10) + 1,
        note: 'Nhân viên y tế trường học',
        user_id: healthCareUser._id
      });
      allHealthCareStaff.push(healthCareStaff);
      console.log(`✅ Đã tạo health care staff cho school ${s}`);

      // Tạo 1 nutrition staff cho mỗi school
      const nutritionUser = await User.create({
        full_name: `Nhân viên Dinh dưỡng ${getRandomName()}`,
        username: `school${s}_nutrition`,
        password_hash: COMMON_PASSWORD_HASH,
        role: 'nutrition_staff',
        avatar_url: `https://picsum.photos/seed/school${s}nutrition/200`,
        status: 1,
        email: getRandomEmail(`school${s}_nutrition`),
        phone_number: getRandomPhone('09'),
        school_id: school._id
      });
      allUsers.push(nutritionUser);
      console.log(`✅ Đã tạo nutrition staff cho school ${s}`);

      // Tạo 3 classAges cho mỗi school
      const schoolClassAges = [];
      const ageNames = ['3-4 tuổi', '4-5 tuổi', '5-6 tuổi'];
      for (let a = 0; a < 3; a++) {
        const classAge = await ClassAge.create({
          age: 3 + a,
          age_name: ageNames[a],
          school_id: school._id
        });
        schoolClassAges.push(classAge);
        allClassAges.push(classAge);
      }
      console.log(`✅ Đã tạo 3 classAges cho school ${s}`);

      // Tạo 2 classes cho mỗi classAge
      const schoolClasses = [];
      let teacherIndex = 0;
      for (let ca = 0; ca < schoolClassAges.length; ca++) {
        const classAge = schoolClassAges[ca];
        for (let c = 1; c <= 2; c++) {
          const startDate = new Date(2024, 8, 1); // 1/9/2024
          const endDate = new Date(2025, 5, 30); // 30/6/2025
          
          const classData = {
            class_name: `S${s}-${String.fromCharCode(65 + ca)}${c}`, // S1-A1, S1-A2, S2-A1, S2-A2, etc.
            academic_year: '2024-2025',
            school_id: school._id,
            class_age_id: classAge._id,
            teacher_id: schoolTeachers[teacherIndex % schoolTeachers.length]._id,
            start_date: startDate,
            end_date: endDate
          };
          
          // Thêm teacher_id2 nếu có đủ giáo viên
          if (teacherIndex + 1 < schoolTeachers.length) {
            classData.teacher_id2 = schoolTeachers[(teacherIndex + 1) % schoolTeachers.length]._id;
          }
          
          const classItem = await Class.create(classData);
          schoolClasses.push(classItem);
          allClasses.push(classItem);
          teacherIndex++;
        }
      }
      console.log(`✅ Đã tạo 6 classes cho school ${s}`);

      // Tạo 6 students cho mỗi class
      let studentCounter = 1;
      for (const classItem of schoolClasses) {
        const classAge = schoolClassAges.find(ca => ca._id.toString() === classItem.class_age_id.toString());
        const age = classAge.age;
        
        for (let st = 1; st <= 6; st++) {
          const student = await Student.create({
            full_name: `Bé ${getRandomName()}`,
            school_id: school._id,
            dob: getRandomDOB(age),
            gender: Math.floor(Math.random() * 2), // 0: male, 1: female
            avatar_url: `https://picsum.photos/seed/school${s}student${studentCounter}/200`,
            status: 1,
            allergy: ['Không', 'Đậu phộng', 'Sữa', 'Hải sản', 'Trứng'][Math.floor(Math.random() * 5)]
          });
          allStudents.push(student);

          // Tạo StudentClass
          await StudentClass.create({
            student_id: student._id,
            class_id: classItem._id,
            discount: 0
          });

          // Tạo ít nhất 1 parent cho mỗi student
          const numParents = Math.floor(Math.random() * 2) + 1; // 1 hoặc 2 parents
          for (let p = 1; p <= numParents; p++) {
            const parentUser = await User.create({
              full_name: `Phụ huynh ${getRandomName()}`,
              username: `school${s}_parent_${studentCounter}_${p}`,
              password_hash: COMMON_PASSWORD_HASH,
              role: 'parent',
              avatar_url: `https://picsum.photos/seed/school${s}parent${studentCounter}${p}/200`,
              status: 1,
              email: getRandomEmail(`school${s}_parent_${studentCounter}_${p}`),
              phone_number: getRandomPhone('09'),
              school_id: school._id
            });
            allUsers.push(parentUser);

            const parent = await Parent.create({
              user_id: parentUser._id
            });
            allParents.push(parent);

            // Tạo ParentStudent
            const relationships = ['Bố', 'Mẹ', 'Người giám hộ'];
            await ParentStudent.create({
              parent_id: parent._id,
              student_id: student._id,
              relationship: relationships[Math.min(p - 1, relationships.length - 1)]
            });
          }
          studentCounter++;
        }
      }
      console.log(`✅ Đã tạo students và parents cho school ${s}`);
    }

    console.log('\n📊 Tổng kết dữ liệu đã tạo:');
    console.log(`- Schools: ${schools.length}`);
    console.log(`- ClassAges: ${allClassAges.length}`);
    console.log(`- Classes: ${allClasses.length}`);
    console.log(`- Teachers: ${allTeachers.length}`);
    console.log(`- Health Care Staff: ${allHealthCareStaff.length}`);
    console.log(`- Nutrition Staff: ${allUsers.filter(u => u.role === 'nutrition_staff').length}`);
    console.log(`- Students: ${allStudents.length}`);
    console.log(`- Parents: ${allParents.length}`);
    console.log(`- Total Users: ${allUsers.length}`);

    console.log('\n✅ Hoàn tất seed dữ liệu mẫu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy seed
seedData();

