# Teacher Routes System

Hệ thống routes riêng cho teacher trong KidsLink.

## Cấu trúc

### 1. `teacherRoutes.js`
File chứa tất cả routes dành riêng cho teacher:
- **Trang chủ**: `/teacher` - Dashboard tổng quan
- **Lớp học**: `/teacher/classes` - Quản lý lớp học
- **Học sinh**: `/teacher/students` - Quản lý học sinh
- **Báo cáo**: `/teacher/reports` - Tạo và quản lý báo cáo
- **Lịch học**: `/teacher/schedule` - Xem và quản lý lịch học
- **Hồ sơ**: `/teacher/profile` - Thông tin cá nhân
- **Cài đặt**: `/teacher/settings` - Cài đặt tài khoản

### 2. `routes.js`
File routes chính với function `getRoutes(userRole)`:
- **Dynamic routing**: Routes thay đổi theo role của user
- **Teacher routes**: Khi user có role `teacher`, hiển thị teacher routes
- **Default routes**: Các role khác hiển thị routes mặc định

## Cách hoạt động

### 1. Role-based Routing
```javascript
// Trong App.js
const { user } = useAuth();
const routes = getRoutes(user?.role);

// Nếu user.role === 'teacher' -> trả về teacherRoutes
// Nếu user.role !== 'teacher' -> trả về baseRoutes
```

### 2. Protected Routes
Tất cả teacher routes đều được bảo vệ:
```javascript
component: <ProtectedRoute requiredRoles={['teacher']}><Component /></ProtectedRoute>
```

### 3. Navigation
- **Sidebar**: Hiển thị menu phù hợp với role
- **Breadcrumbs**: Tự động cập nhật theo route hiện tại
- **Active state**: Highlight menu item đang active

## Các trang Teacher

### 1. Trang chủ (`/teacher`)
- Dashboard tổng quan với thống kê
- Thông báo quan trọng
- Lịch học tuần
- Hoạt động gần đây

### 2. Lớp học (`/teacher/classes`)
- Danh sách các lớp được phân công
- Thống kê: tổng lớp, lớp hoạt động, học sinh, lớp gần đầy
- Thông tin chi tiết: độ tuổi, giáo viên, phòng, lịch học
- Thao tác: xem chi tiết, quản lý lớp

### 3. Học sinh (`/teacher/students`)
- Danh sách học sinh với tìm kiếm
- Thống kê: tổng học sinh, có mặt, vắng mặt, đi muộn
- Thông tin: tên, lớp, trạng thái, phụ huynh, hoạt động cuối
- Thao tác: điểm danh, thêm học sinh, xem/sửa thông tin

### 4. Báo cáo (`/teacher/reports`)
- Tạo và quản lý báo cáo
- Phân loại: hàng ngày, hàng tuần, sức khỏe, hoạt động
- Lọc theo lớp học và loại báo cáo
- Thao tác: tạo mới, chỉnh sửa, xuất Excel

### 5. Lịch học (`/teacher/schedule`)
- Xem lịch học theo ngày/tuần/tháng
- Thông tin hoạt động: thời gian, lớp, mô tả, trạng thái
- Thao tác: thêm hoạt động, in lịch, chỉnh sửa

### 6. Hồ sơ (`/teacher/profile`)
- Thông tin cá nhân và chuyên môn
- Chỉnh sửa thông tin
- Upload avatar
- Thông tin cơ bản: tên, email, phone, địa chỉ

### 7. Cài đặt (`/teacher/settings`)
- Cài đặt thông báo
- Quyền riêng tư
- Tùy chọn: ngôn ngữ, múi giờ, định dạng ngày, theme
- Bảo mật: 2FA, session timeout, đổi mật khẩu

## Icons và Colors

### Icons
- **Trang chủ**: `ni ni-tv-2` (primary)
- **Lớp học**: `ni ni-books` (success)
- **Học sinh**: `ni ni-circle-08` (info)
- **Báo cáo**: `ni ni-single-copy-04` (warning)
- **Lịch học**: `ni ni-calendar-grid-58` (dark)
- **Hồ sơ**: `ni ni-single-02` (secondary)
- **Cài đặt**: `ni ni-settings-gear-65` (text)

### Colors
- **Primary**: Xanh dương - Trang chủ
- **Success**: Xanh lá - Lớp học
- **Info**: Xanh nhạt - Học sinh
- **Warning**: Vàng - Báo cáo
- **Dark**: Đen - Lịch học
- **Secondary**: Xám - Hồ sơ
- **Text**: Màu chữ - Cài đặt

## Responsive Design

Tất cả các trang đều responsive:
- **Mobile**: Layout 1 cột, thu gọn menu
- **Tablet**: Layout 2 cột, điều chỉnh kích thước
- **Desktop**: Layout đầy đủ, hiển thị tối đa

## Security

- **Authentication**: Phải đăng nhập
- **Authorization**: Chỉ role `teacher` mới truy cập được
- **Route protection**: ProtectedRoute component
- **Data validation**: PropTypes validation

## Future Enhancements

- [ ] Nested routes cho sub-pages
- [ ] Route guards cho specific permissions
- [ ] Lazy loading cho performance
- [ ] Route animations
- [ ] Deep linking support
- [ ] Route history management



