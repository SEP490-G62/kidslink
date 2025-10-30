# Teacher Dashboard

Trang dashboard dành cho giáo viên trong hệ thống KidsLink.

## Tính năng chính

### 1. Trang chủ Teacher (`/teacher`)
- **Yêu cầu quyền**: Chỉ user có role `teacher` mới có thể truy cập
- **Route**: `/teacher`
- **Component chính**: `TeacherHome`

### 2. Các component con

#### TeacherWelcome
- Hiển thị lời chào cá nhân hóa theo thời gian trong ngày
- Lấy tên user từ AuthContext

#### ClassOverview
- Hiển thị tổng quan các lớp học được phân công
- Thông tin: tên lớp, độ tuổi, số học sinh, trạng thái, hoạt động tiếp theo
- Các nút thao tác: Xem chi tiết, Quản lý lớp

#### StudentList
- Danh sách học sinh gần đây với thông tin:
  - Tên học sinh, lớp, avatar
  - Trạng thái hiện tại (có mặt, vắng mặt, đi muộn)
  - Hoạt động cuối cùng
  - Liên kết xem hồ sơ

#### ImportantNotifications
- Thông báo quan trọng từ nhà trường
- Phân loại theo mức độ ưu tiên và loại thông báo
- Hiển thị thời gian và trạng thái

#### WeeklySchedule
- Lịch học trong tuần
- Hiển thị các hoạt động theo ngày
- Đánh dấu ngày hiện tại
- Trạng thái hoạt động (hoàn thành, sắp tới, đã hủy)

#### QuickActions
- Các thao tác nhanh thường dùng:
  - Điểm danh
  - Tạo báo cáo
  - Gửi thông báo
  - Chia sẻ ảnh
  - Xem lịch học
  - Cài đặt lớp

#### RecentActivities
- Lịch sử hoạt động gần đây
- Phân loại theo loại hoạt động
- Trạng thái và thời gian thực hiện

### 3. Thống kê tổng quan
- Tổng số lớp
- Tổng số học sinh
- Thông báo chưa đọc
- Hoạt động hôm nay

## Cấu trúc file

```
layouts/teacher/
├── index.js                    # Component chính
├── components/
│   ├── TeacherWelcome.js       # Lời chào
│   ├── ClassOverview.js        # Tổng quan lớp học
│   ├── StudentList.js          # Danh sách học sinh
│   ├── ImportantNotifications.js # Thông báo quan trọng
│   ├── WeeklySchedule.js       # Lịch học tuần
│   ├── QuickActions.js         # Thao tác nhanh
│   └── RecentActivities.js     # Hoạt động gần đây
└── README.md                   # Tài liệu này
```

## Cách sử dụng

1. User phải đăng nhập với role `teacher`
2. Truy cập `/teacher` để xem dashboard
3. Sử dụng các widget để quản lý lớp học và học sinh
4. Theo dõi lịch học và thông báo quan trọng

## Lưu ý

- Tất cả dữ liệu hiện tại là mock data
- Cần tích hợp với API backend để lấy dữ liệu thực
- Các component được thiết kế responsive cho mobile và desktop
