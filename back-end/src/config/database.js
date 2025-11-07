const mongoose = require('mongoose');

const connectDB = async () => {
  try {
<<<<<<< HEAD
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink1', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
=======
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink');
>>>>>>> 6567548c7afd8fa08704a8dea3ffb093aec8abda

    console.log(`📊 MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
