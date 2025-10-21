# Hướng dẫn Test Chuyển hướng Teacher

## Mô tả
Khi đăng nhập với role `teacher`, hệ thống sẽ tự động chuyển hướng đến trang Teacher Dashboard (`/teacher`).

## Cách test

### 1. Chuẩn bị dữ liệu test
Đảm bảo trong database có user với role `teacher`:
```json
{
  "username": "teacher_test",
  "password": "123456",
  "role": "teacher",
  "name": "Giáo viên Test"
}
```

### 2. Test chuyển hướng
1. Mở trình duyệt và truy cập `http://localhost:3000/authentication/sign-in`
2. Đăng nhập với tài khoản teacher:
   - Username: `teacher_test`
   - Password: `123456`
3. Sau khi đăng nhập thành công, hệ thống sẽ:
   - Hiển thị thông báo "Đăng nhập thành công!"
   - Tự động chuyển hướng đến `/teacher` sau 1 giây
   - Hiển thị trang Teacher Dashboard

### 3. Kiểm tra kết quả
Trên trang Teacher Dashboard, bạn sẽ thấy:
- ✅ Component `TeacherRedirectTest` hiển thị thông tin test
- ✅ Thông báo "Thành công! Teacher đã được chuyển hướng đến trang Teacher Dashboard"
- ✅ Thông tin user: role = "teacher", tên user, URL hiện tại

### 4. Test các role khác
Để đảm bảo logic hoạt động đúng, test với các role khác:
- `admin` → chuyển đến `/admin/dashboard`
- `parent` → chuyển đến `/parent/dashboard`
- `school_admin` → chuyển đến `/school-admin/dashboard`

### 5. Test bảo mật
- Truy cập trực tiếp `/teacher` mà chưa đăng nhập → chuyển về `/authentication/sign-in`
- Đăng nhập với role khác (không phải teacher) → chuyển đến `/unauthorized`

## Code liên quan

### File chính: `frond-end/src/layouts/authentication/sign-in/index.js`
```javascript
case 'teacher':
  navigate('/teacher');
  break;
```

### File route: `frond-end/src/routes.js`
```javascript
{
  type: "route",
  name: "Teacher Dashboard",
  key: "teacher-dashboard",
  route: "/teacher",
  icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-books" />,
  component: <ProtectedRoute requiredRoles={['teacher']}><TeacherHome /></ProtectedRoute>,
}
```

### File component: `frond-end/src/layouts/teacher/index.js`
- Import và sử dụng `TeacherRedirectTest` để kiểm tra

## Xóa component test
Sau khi test xong, có thể xóa:
1. File `frond-end/src/layouts/teacher/components/TeacherRedirectTest.js`
2. Import và sử dụng trong `frond-end/src/layouts/teacher/index.js`
3. File `frond-end/TEACHER_REDIRECT_TEST.md`

## Lưu ý
- Component test chỉ hiển thị khi đang trong môi trường development
- Trong production, nên xóa component test để tránh hiển thị thông tin debug
