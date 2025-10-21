# TeacherNavbar

Header/Navigation bar riêng cho teacher trong hệ thống KidsLink.

## Tính năng chính

### 1. Tìm kiếm
- **Placeholder**: "Tìm kiếm học sinh, lớp học..."
- **Responsive**: Tự động điều chỉnh kích thước theo màn hình
- **Style**: Background trong suốt với hiệu ứng hover

### 2. Thông báo
- **Badge**: Hiển thị số thông báo chưa đọc
- **Menu**: Dropdown với danh sách thông báo
- **Phân loại**: Meeting, trip, policy, attendance, photo
- **Icon**: Mỗi loại thông báo có icon riêng
- **Trạng thái**: Đánh dấu đã đọc/chưa đọc

### 3. Profile Menu
- **Avatar**: Hiển thị ảnh đại diện với border màu xanh
- **Thông tin**: Tên, email, role
- **Menu items**:
  - Hồ sơ cá nhân
  - Cài đặt
  - Trợ giúp
  - Đăng xuất

### 4. Settings
- **Icon**: Settings gear
- **Chức năng**: Mở configurator

### 5. Mobile Menu
- **Responsive**: Ẩn/hiện theo kích thước màn hình
- **Toggle**: Mở/đóng sidebar

## Cấu trúc file

```
TeacherNavbar/
├── index.js                    # Component chính
├── styles.js                   # Styles và themes
├── TeacherProfileMenu.js       # Profile dropdown menu
├── TeacherNotificationMenu.js  # Notifications dropdown menu
└── README.md                   # Tài liệu này
```

## Props

### TeacherNavbar
- `absolute` (bool): Navbar có position absolute không
- `light` (bool): Theme sáng/tối
- `isMini` (bool): Sidebar ở chế độ mini không

### TeacherProfileMenu
- `open` (bool): Menu có mở không
- `anchorEl` (Element): Element anchor cho menu
- `onClose` (function): Callback khi đóng menu
- `user` (object): Thông tin user

### TeacherNotificationMenu
- `open` (bool): Menu có mở không
- `anchorEl` (Element): Element anchor cho menu
- `onClose` (function): Callback khi đóng menu
- `notifications` (array): Danh sách thông báo

## Styles đặc biệt

### Teacher-specific styling
- **Border left**: 4px solid success color
- **Search box**: Background trong suốt với hover effects
- **Notification badge**: Custom positioning
- **Profile avatar**: Border màu xanh với hover effect

### Responsive design
- **Mobile**: Search box thu nhỏ, ẩn một số elements
- **Tablet**: Điều chỉnh kích thước phù hợp
- **Desktop**: Hiển thị đầy đủ tất cả tính năng

## Sử dụng

```jsx
import TeacherNavbar from "examples/Navbars/TeacherNavbar";

// Trong component
<TeacherNavbar 
  absolute={false}
  light={true}
  isMini={false}
/>
```

## Dependencies

- Material-UI components
- Argon Dashboard components
- AuthContext for user management
- React Router for navigation

## Mock Data

Hiện tại sử dụng mock data cho notifications:
```javascript
const notifications = [
  {
    id: 1,
    title: "Họp phụ huynh tuần tới",
    message: "Cuộc họp phụ huynh định kỳ sẽ diễn ra vào thứ 6",
    time: "2 giờ trước",
    type: "meeting",
    unread: true
  },
  // ...
];
```

## TODO

- [ ] Tích hợp API thực cho notifications
- [ ] Thêm chức năng tìm kiếm thực tế
- [ ] Tạo trang profile riêng
- [ ] Tạo trang settings riêng
- [ ] Thêm keyboard shortcuts
- [ ] Thêm dark mode support



