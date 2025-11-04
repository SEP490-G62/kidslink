const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://thangnd11:T110022t@kidslink.kwlabvq.mongodb.net/kidslink', {
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
