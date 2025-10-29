import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // read either MONGO_URI (your .env) or fallback to MONGODB_URI if present
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/kidslink";

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📊 MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
