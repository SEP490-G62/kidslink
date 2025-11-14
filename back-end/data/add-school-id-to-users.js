// Run in mongosh
// Script để thêm school_id vào bảng users

const dbx = db.getSiblingDB('kidslink');

// School ID từ seed file
const schoolId = ObjectId("671000000000000000000001");

// Cập nhật tất cả user chưa có school_id
const result = dbx.users.updateMany(
  { school_id: { $exists: false } },
  { $set: { school_id: schoolId } }
);

print(`Đã cập nhật ${result.modifiedCount} user với school_id: ${schoolId}`);

// Kiểm tra kết quả
const usersWithSchool = dbx.users.countDocuments({ school_id: schoolId });
const usersWithoutSchool = dbx.users.countDocuments({ school_id: { $exists: false } });

print(`Tổng số user có school_id: ${usersWithSchool}`);
print(`Số user chưa có school_id: ${usersWithoutSchool}`);

// Nếu muốn cập nhật tất cả user (kể cả đã có school_id), sử dụng lệnh sau:
// dbx.users.updateMany(
//   {},
//   { $set: { school_id: schoolId } }
// );

