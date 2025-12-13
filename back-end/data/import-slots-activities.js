require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/config/database');

// Import models
const Slot = require('../src/models/Slot');
const Activity = require('../src/models/Activity');
const School = require('../src/models/School');

async function importData() {
  try {
    // Kết nối database
    await connectDB();
    console.log('✅ Đã kết nối database');

    // Đọc file JSON
    const activitiesPath = path.join(__dirname, 'sample-activities.json');
    const slotsPath = path.join(__dirname, 'sample-slots.json');

    const activitiesData = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
    const slotsData = JSON.parse(fs.readFileSync(slotsPath, 'utf8'));

    // Lấy danh sách schools
    const schools = await School.find({}).select('_id');
    if (schools.length < 2) {
      console.error('❌ Cần ít nhất 2 schools trong database. Vui lòng chạy seed-sample-data.js trước.');
      process.exit(1);
    }

    console.log(`✅ Tìm thấy ${schools.length} schools`);

    // Thay thế placeholder và import activities
    const activitiesToInsert = [];
    for (let i = 0; i < activitiesData.length; i++) {
      const activity = activitiesData[i];
      let schoolId = null;

      if (activity.school_id === '{{school_id_1}}') {
        schoolId = schools[0]._id;
      } else if (activity.school_id === '{{school_id_2}}') {
        schoolId = schools[1]._id;
      }

      if (schoolId) {
        activitiesToInsert.push({
          ...activity,
          school_id: schoolId
        });
      }
    }

    // Import activities
    const insertedActivities = await Activity.insertMany(activitiesToInsert);
    console.log(`✅ Đã import ${insertedActivities.length} activities`);

    // Thay thế placeholder và import slots
    const slotsToInsert = [];
    for (let i = 0; i < slotsData.length; i++) {
      const slot = slotsData[i];
      let schoolId = null;

      if (slot.school_id === '{{school_id_1}}') {
        schoolId = schools[0]._id;
      } else if (slot.school_id === '{{school_id_2}}') {
        schoolId = schools[1]._id;
      }

      if (schoolId) {
        slotsToInsert.push({
          ...slot,
          school_id: schoolId
        });
      }
    }

    // Import slots
    const insertedSlots = await Slot.insertMany(slotsToInsert);
    console.log(`✅ Đã import ${insertedSlots.length} slots`);

    console.log('\n📊 Tổng kết:');
    console.log(`- Activities: ${insertedActivities.length}`);
    console.log(`- Slots: ${insertedSlots.length}`);
    console.log('\n✅ Hoàn tất import dữ liệu slots và activities!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi import dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy import
importData();

