const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink1', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`📊 MongoDB kết nối thành công: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

const removeClassNameUniqueIndex = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('classes');
    
    // Lấy danh sách tất cả indexes
    const indexes = await collection.indexes();
    console.log('📋 Danh sách indexes hiện tại:', indexes);
    
    // Tìm và xóa index unique trên class_name
    const classNameIndex = indexes.find(idx => 
      idx.key && idx.key.class_name === 1 && idx.unique === true
    );
    
    if (classNameIndex) {
      console.log('🔍 Tìm thấy index unique trên class_name:', classNameIndex.name);
      await collection.dropIndex(classNameIndex.name);
      console.log('✅ Đã xóa index unique trên class_name thành công!');
    } else {
      console.log('ℹ️  Không tìm thấy index unique trên class_name');
    }
    
    // Hiển thị lại danh sách indexes sau khi xóa
    const updatedIndexes = await collection.indexes();
    console.log('📋 Danh sách indexes sau khi xóa:', updatedIndexes);
    
    await mongoose.connection.close();
    console.log('✅ Hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi xóa index:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Chạy script
removeClassNameUniqueIndex();

