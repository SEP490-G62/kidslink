require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/config/database');

// Import models
const Class = require('../src/models/Class');
const ClassAge = require('../src/models/ClassAge');
const StudentClass = require('../src/models/StudentClass');

// Hàm chuyển đổi ObjectId từ format MongoDB export
function convertObjectId(obj) {
  if (obj && obj.$oid) {
    return new mongoose.Types.ObjectId(obj.$oid);
  }
  return obj;
}

// Hàm chuyển đổi Date từ format MongoDB export
function convertDate(obj) {
  if (obj && obj.$date) {
    return new Date(obj.$date);
  }
  return obj;
}

// Hàm chuyển đổi toàn bộ object
function convertMongoData(data) {
  if (Array.isArray(data)) {
    return data.map(item => convertMongoData(item));
  }
  if (data && typeof data === 'object') {
    const converted = {};
    for (const key in data) {
      if (key === '_id' || key.endsWith('_id') || key.endsWith('id')) {
        converted[key] = convertObjectId(data[key]);
      } else if (key.includes('date') || key.includes('Date') || key === 'createdAt' || key === 'updatedAt') {
        converted[key] = convertDate(data[key]);
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        converted[key] = convertMongoData(data[key]);
      } else {
        converted[key] = data[key];
      }
    }
    return converted;
  }
  return data;
}

async function restoreClasses() {
  try {
    // Kết nối database
    await connectDB();
    console.log('✅ Đã kết nối database');

    // Đọc file JSON (từ thư mục gốc của workspace)
    const workspaceRoot = path.resolve(__dirname, '../..');
    const classesPath = path.join(workspaceRoot, 'kidslink.classes.json');
    const classAgesPath = path.join(workspaceRoot, 'kidslink.classages.json');
    const studentClassesPath = path.join(workspaceRoot, 'kidslink.studentclasses.json');

    if (!fs.existsSync(classesPath)) {
      console.error('❌ Không tìm thấy file kidslink.classes.json');
      process.exit(1);
    }

    if (!fs.existsSync(classAgesPath)) {
      console.error('❌ Không tìm thấy file kidslink.classages.json');
      process.exit(1);
    }

    if (!fs.existsSync(studentClassesPath)) {
      console.error('❌ Không tìm thấy file kidslink.studentclasses.json');
      process.exit(1);
    }

    // Đọc và parse JSON
    console.log('📖 Đang đọc file JSON...');
    const classesData = JSON.parse(fs.readFileSync(classesPath, 'utf8'));
    const classAgesData = JSON.parse(fs.readFileSync(classAgesPath, 'utf8'));
    const studentClassesData = JSON.parse(fs.readFileSync(studentClassesPath, 'utf8'));

    // Chuyển đổi dữ liệu
    console.log('🔄 Đang chuyển đổi dữ liệu...');
    const convertedClassAges = convertMongoData(classAgesData);
    const convertedClasses = convertMongoData(classesData);
    const convertedStudentClasses = convertMongoData(studentClassesData);

    // Khôi phục ClassAges trước
    console.log('\n📝 Đang khôi phục ClassAges...');
    let classAgeCount = 0;
    for (const classAge of convertedClassAges) {
      try {
        // Kiểm tra xem đã tồn tại chưa
        const existing = await ClassAge.findById(classAge._id);
        if (!existing) {
          await ClassAge.create(classAge);
          classAgeCount++;
          console.log(`  ✅ Đã khôi phục ClassAge: ${classAge.age_name} (${classAge._id})`);
        } else {
          console.log(`  ⚠️  ClassAge đã tồn tại: ${classAge.age_name} (${classAge._id})`);
        }
      } catch (error) {
        console.error(`  ❌ Lỗi khi khôi phục ClassAge ${classAge._id}:`, error.message);
      }
    }
    console.log(`✅ Đã khôi phục ${classAgeCount}/${convertedClassAges.length} ClassAges`);

    // Khôi phục Classes
    console.log('\n📝 Đang khôi phục Classes...');
    let classCount = 0;
    for (const classItem of convertedClasses) {
      try {
        // Kiểm tra xem đã tồn tại chưa
        const existing = await Class.findById(classItem._id);
        if (!existing) {
          // Loại bỏ __v và timestamps nếu có trong dữ liệu cũ
          const classData = {
            _id: classItem._id,
            class_name: classItem.class_name,
            academic_year: classItem.academic_year,
            school_id: classItem.school_id,
            class_age_id: classItem.class_age_id,
            teacher_id: classItem.teacher_id,
            teacher_id2: classItem.teacher_id2 || undefined,
            start_date: classItem.start_date,
            end_date: classItem.end_date
          };
          
          await Class.create(classData);
          classCount++;
          console.log(`  ✅ Đã khôi phục Class: ${classItem.class_name} (${classItem._id})`);
        } else {
          console.log(`  ⚠️  Class đã tồn tại: ${classItem.class_name} (${classItem._id})`);
        }
      } catch (error) {
        console.error(`  ❌ Lỗi khi khôi phục Class ${classItem._id}:`, error.message);
      }
    }
    console.log(`✅ Đã khôi phục ${classCount}/${convertedClasses.length} Classes`);

    // Khôi phục StudentClasses
    console.log('\n📝 Đang khôi phục StudentClasses...');
    let studentClassCount = 0;
    for (const studentClass of convertedStudentClasses) {
      try {
        // Kiểm tra xem đã tồn tại chưa
        const existing = await StudentClass.findOne({
          student_id: studentClass.student_id,
          class_id: studentClass.class_id
        });
        if (!existing) {
          const studentClassData = {
            _id: studentClass._id,
            student_id: studentClass.student_id,
            class_id: studentClass.class_id,
            discount: studentClass.discount || 0
          };
          
          await StudentClass.create(studentClassData);
          studentClassCount++;
        } else {
          console.log(`  ⚠️  StudentClass đã tồn tại: student ${studentClass.student_id} - class ${studentClass.class_id}`);
        }
      } catch (error) {
        // Bỏ qua lỗi duplicate key
        if (error.code === 11000) {
          console.log(`  ⚠️  StudentClass đã tồn tại (duplicate): student ${studentClass.student_id} - class ${studentClass.class_id}`);
        } else {
          console.error(`  ❌ Lỗi khi khôi phục StudentClass:`, error.message);
        }
      }
    }
    console.log(`✅ Đã khôi phục ${studentClassCount}/${convertedStudentClasses.length} StudentClasses`);

    console.log('\n📊 Tổng kết khôi phục:');
    console.log(`- ClassAges: ${classAgeCount}/${convertedClassAges.length}`);
    console.log(`- Classes: ${classCount}/${convertedClasses.length}`);
    console.log(`- StudentClasses: ${studentClassCount}/${convertedStudentClasses.length}`);

    console.log('\n✅ Hoàn tất khôi phục dữ liệu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khôi phục dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy restore
restoreClasses();

