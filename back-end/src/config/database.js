const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });


    console.log(`📊 MongoDB kết nối thành công: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
