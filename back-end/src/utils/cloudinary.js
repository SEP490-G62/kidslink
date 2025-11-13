const { v2: cloudinary } = require('cloudinary');

// Cloudinary hỗ trợ cấu hình bằng biến môi trường CLOUDINARY_URL chuẩn:
// CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// Nếu biến này tồn tại, cloudinary sẽ tự parse; ta vẫn gọi config() để nạp.
cloudinary.config({
  secure: true
});

if (!process.env.CLOUDINARY_URL) {
  console.warn('⚠️ CLOUDINARY_URL chưa được cấu hình. Upload ảnh sẽ thất bại.');
}

module.exports = cloudinary;





