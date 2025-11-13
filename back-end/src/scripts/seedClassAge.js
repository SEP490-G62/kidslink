// Script để seed ClassAge vào database
const mongoose = require('mongoose');
const ClassAge = require('../models/ClassAge');
require('dotenv').config();

const classAgesData = [
  { age: 3, age_name: '3 tuổi' },
  { age: 4, age_name: '4 tuổi' },
  { age: 5, age_name: '5 tuổi' },
  { age: 6, age_name: '6 tuổi' },
];

const seedClassAges = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kidslink';
    await mongoose.connect(MONGO_URI);
    
    console.log('Connected to MongoDB');
    
    // Xóa dữ liệu cũ
    await ClassAge.deleteMany({});
    console.log('Cleared existing ClassAge data');
    
    // Thêm dữ liệu mới
    await ClassAge.insertMany(classAgesData);
    console.log('ClassAge data seeded successfully');
    
    console.log('Seeded ClassAges:');
    const classAges = await ClassAge.find();
    classAges.forEach(age => {
      console.log(`  - ${age.age_name} (ID: ${age._id})`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding ClassAge:', error);
    mongoose.connection.close();
  }
};

seedClassAges();
