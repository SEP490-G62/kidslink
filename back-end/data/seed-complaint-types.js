// Run in mongosh
// Script để thêm 3 loại đơn vào ComplaintType

const dbx = db.getSiblingDB('kidslink');

const today = new Date();

// Thêm 3 loại đơn vào complainttypes collection
dbx.complainttypes.insertMany([
  {
    category: 'parent',
    name: 'Khiếu nại',
    description: 'Đơn khiếu nại từ phụ huynh',
    createdAt: today,
    updatedAt: today
  },
  {
    category: 'parent',
    name: 'Góp ý',
    description: 'Đơn góp ý từ phụ huynh',
    createdAt: today,
    updatedAt: today
  },
  {
    category: 'teacher',
    name: 'Đơn xin nghỉ',
    description: 'Đơn xin nghỉ từ giáo viên',
    createdAt: today,
    updatedAt: today
  }
]);

print("Đã thêm 3 loại đơn vào ComplaintType: Khiếu nại (parent), Góp ý (parent), Đơn xin nghỉ (teacher)");

