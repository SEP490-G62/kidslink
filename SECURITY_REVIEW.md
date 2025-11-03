# BÁO CÁO ĐÁNH GIÁ BẢO MẬT - KIDSLINK

## Ngày: 03/11/2025

## 1. CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN

### 🔴 CỰC KỲ NGHIÊM TRỌNG

#### 1.1. Thiếu kiểm tra school_id trong Class Controller
**Vị trí**: `back-end/src/controllers/classController.js`

**Vấn đề**: School admin có thể:
- Xem tất cả lớp của mọi trường
- Tạo/sửa/xóa lớp của trường khác
- Thêm học sinh vào lớp của trường khác

**Tác động**: School A có thể truy cập và thao tác dữ liệu của School B

**Giải pháp đã áp dụng cho Post**:
```javascript
// Kiểm tra school_id trước khi thao tác
const currentUser = await User.findById(req.user.id).select('school_id role');
if (currentUser.role === 'school_admin') {
  if (classInfo.school_id.toString() !== currentUser.school_id.toString()) {
    return res.status(403).json({ message: 'Không có quyền' });
  }
}
```

**KHUYẾN NGHỊ**: CẦN SỬA NGAY

---

#### 1.2. Thiếu kiểm tra school_id trong Student Controller
**Vị trí**: `back-end/src/controllers/studentController.js`

**Vấn đề**: 
- School admin có thể xem học sinh của trường khác
- Tạo/sửa/xóa học sinh trong lớp không thuộc trường mình

**KHUYẾN NGHỊ**: CẦN SỬA NGAY

---

#### 1.3. Thiếu kiểm tra school_id trong Parent CRUD
**Vị trí**: `back-end/src/controllers/parentCRUDController.js`

**Vấn đề**:
- School admin có thể thêm phụ huynh cho học sinh của trường khác
- Xóa/sửa phụ huynh của học sinh trường khác

**KHUYẾN NGHỊ**: CẦN SỬA NGAY

---

### 🟡 NGHIÊM TRỌNG

#### 2.1. Token không có thời gian hết hạn rõ ràng
**Vị trí**: `back-end/src/controllers/authController.js`

**KHUYẾN NGHỊ**: 
```javascript
const token = jwt.sign(payload, secret, { expiresIn: '24h' });
```

---

#### 2.2. Password hash không rõ số vòng bcrypt
**KHUYẾN NGHỊ**: Sử dụng tối thiểu 12 rounds:
```javascript
const hashedPassword = await bcrypt.hash(password, 12);
```

---

## 2. KIẾN TRÚC BẢO MẬT HIỆN TẠI

### ✅ ĐIỂM TỐT

1. **Middleware authentication/authorization đã tốt**:
   - Kiểm tra JWT token
   - Phân quyền theo role
   - Trả về lỗi rõ ràng

2. **Post Controller đã được bảo mật**:
   - Kiểm tra school_id khi CRUD
   - Filter posts theo trường
   - Validate quyền sở hữu

3. **Model User đã được cập nhật**:
   - Thêm trường `school_id`
   - Thêm trường `address`

---

## 3. KHUYẾN NGHỊ TRIỂN KHAI NGAY

### Ưu tiên 1: Thêm middleware kiểm tra school_id

Tạo file `back-end/src/middleware/schoolScope.js`:

```javascript
const User = require('../models/User');
const Class = require('../models/Class');

// Middleware kiểm tra school_id cho các thao tác với Class
async function checkSchoolAccess(modelName) {
  return async (req, res, next) => {
    try {
      const currentUser = await User.findById(req.user.id).select('school_id role');
      
      // Admin có full access
      if (currentUser.role === 'admin') {
        return next();
      }
      
      // School admin phải có school_id
      if (currentUser.role === 'school_admin') {
        if (!currentUser.school_id) {
          return res.status(403).json({
            success: false,
            message: 'School admin chưa được gán vào trường'
          });
        }
        
        // Lưu school_id vào req để controller sử dụng
        req.userSchoolId = currentUser.school_id;
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền truy cập'
      });
    }
  };
}

module.exports = { checkSchoolAccess };
```

### Ưu tiên 2: Cập nhật tất cả controllers

Thêm filter `school_id` vào:
- `classController.js` - listClasses, getClassById, createClass, updateClass, deleteClass
- `studentController.js` - getAllStudents, getStudentsByClass, createStudent, updateStudent
- `parentCRUDController.js` - createParent, updateParent, deleteParent

### Ưu tiên 3: Cập nhật database

Chạy migration để thêm `school_id` cho các User hiện có:

```javascript
// migration-add-school-id.js
const User = require('./models/User');
const Class = require('./models/Class');
const Teacher = require('./models/Teacher');

async function migrateSchoolId() {
  // Gán school_id cho school_admin dựa trên Class họ quản lý
  const schoolAdmins = await User.find({ role: 'school_admin' });
  
  for (const admin of schoolAdmins) {
    // Logic gán school_id
    // Ví dụ: lấy từ Class đầu tiên họ tạo, hoặc từ bảng riêng
  }
  
  // Tương tự cho teacher, parent...
}
```

---

## 4. CHECKLIST BẢO MẬT

### Ngay lập tức (Tuần này)
- [ ] Thêm kiểm tra school_id vào Class Controller
- [ ] Thêm kiểm tra school_id vào Student Controller  
- [ ] Thêm kiểm tra school_id vào Parent CRUD Controller
- [ ] Test kỹ các trường hợp cross-school access

### Tuần tới
- [ ] Thêm middleware checkSchoolAccess
- [ ] Cập nhật database với school_id cho user hiện có
- [ ] Thêm logging cho các thao tác nhạy cảm
- [ ] Code review toàn bộ controllers

### Dài hạn
- [ ] Implement rate limiting per school
- [ ] Thêm audit log
- [ ] Encrypt dữ liệu nhạy cảm
- [ ] Penetration testing

---

## 5. KẾT LUẬN

**Tình trạng**: 🔴 KHẨN CẤP - Cần khắc phục ngay

**Mức độ rủi ro**: CAO

**Ước tính thời gian sửa**: 2-3 ngày làm việc

**Khuyến nghị**: KHÔNG nên deploy production cho đến khi các vấn đề Priority 1 được giải quyết.

---

## 6. LIÊN HỆ

Nếu có thắc mắc về báo cáo này, vui lòng liên hệ team security.
