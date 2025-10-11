# Models Documentation

Thư mục này chứa tất cả các Mongoose models cho hệ thống KidsLink theo ERD đã thiết kế.

## Cấu trúc Models

### 1. Core Models (Models cơ bản)
- **User.js** - Quản lý thông tin người dùng cơ bản
- **School.js** - Thông tin trường học
- **Class.js** - Thông tin lớp học
- **ClassAge.js** - Nhóm tuổi cho lớp học
- **Student.js** - Thông tin học sinh
- **Parent.js** - Thông tin phụ huynh

### 2. Staff Models (Models nhân viên)
- **Teacher.js** - Thông tin giáo viên
- **HealthCareStaff.js** - Thông tin nhân viên y tế

### 3. Activity Models (Models hoạt động)
- **Activity.js** - Các hoạt động trong lớp
- **Calendar.js** - Lịch học của lớp
- **Slot.js** - Khung giờ hoạt động

### 4. Meal Models (Models bữa ăn)
- **Meal.js** - Thông tin bữa ăn
- **ClassAgeMeal.js** - Liên kết bữa ăn với nhóm tuổi
- **Dish.js** - Thông tin món ăn

### 5. Communication Models (Models giao tiếp)
- **Conversation.js** - Cuộc trò chuyện
- **ConversationParticipant.js** - Người tham gia cuộc trò chuyện
- **Message.js** - Tin nhắn
- **Post.js** - Bài đăng
- **PostImage.js** - Hình ảnh bài đăng
- **PostComment.js** - Bình luận bài đăng
- **PostLike.js** - Lượt thích bài đăng

### 6. Health Models (Models sức khỏe)
- **HealthNotice.js** - Thông báo sức khỏe
- **HealthRecord.js** - Hồ sơ sức khỏe

### 7. Financial Models (Models tài chính)
- **Fee.js** - Thông tin phí
- **ClassFee.js** - Liên kết phí với lớp học
- **Invoice.js** - Hóa đơn
- **Payment.js** - Thanh toán

### 8. Junction Tables (Bảng liên kết)
- **TeacherClass.js** - Liên kết giáo viên với lớp học
- **ParentStudent.js** - Liên kết phụ huynh với học sinh
- **StudentClass.js** - Liên kết học sinh với lớp học
- **DailyReport.js** - Báo cáo hàng ngày
- **Pickup.js** - Thông tin người đón
- **PickupStudent.js** - Liên kết người đón với học sinh

## Cách sử dụng

```javascript
const { User, School, Class, Student } = require('./models');

// Tạo user mới
const newUser = new User({
  full_name: 'Nguyễn Văn A',
  username: 'nguyenvana',
  password_hash: 'hashed_password',
  role: 'parent',
  avatar_url: 'avatar_url',
  status: 1
});

// Lưu vào database
await newUser.save();
```

## Lưu ý quan trọng

1. Tất cả các models đều có timestamps (createdAt, updatedAt)
2. Các trường bắt buộc được đánh dấu `required: true`
3. Các trường unique có index để đảm bảo tính duy nhất
4. Các junction tables có compound index để tránh duplicate
5. Sử dụng ObjectId để liên kết giữa các collections
6. Các enum values được định nghĩa rõ ràng cho các trường có giá trị cố định




