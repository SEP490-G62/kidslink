const mongoose = require('mongoose');

const connectDB = async () => {
  try {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📊 MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
