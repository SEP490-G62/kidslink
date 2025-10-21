# 🔐 Chức năng Quên Mật Khẩu - KidsLink

## 📋 Tổng quan
Chức năng quên mật khẩu cho phép người dùng khôi phục mật khẩu thông qua email khi họ quên mật khẩu hiện tại.

## 🚀 Tính năng

### ✨ Giao diện người dùng
- **Form nhập email** với validation đầy đủ
- **Thông báo thành công** với giao diện đẹp mắt
- **Xử lý lỗi** và hiển thị thông báo phù hợp
- **Loading state** khi đang xử lý
- **Responsive design** tương thích mọi thiết bị

### 🔧 Chức năng kỹ thuật
- **Validation email** theo chuẩn RFC
- **Tích hợp API** với backend
- **Xử lý lỗi** toàn diện
- **Auto redirect** về trang đăng nhập
- **Snackbar notifications** cho feedback

## 📁 Cấu trúc file

```
frond-end/src/
├── layouts/authentication/forgot-password/
│   └── index.js                    # Component chính
├── components/
│   └── SuccessMessage.js           # Component thông báo thành công
├── services/
│   └── authService.js              # Service API authentication
└── routes.js                       # Định tuyến
```

## 🎯 Cách sử dụng

### 1. Truy cập trang quên mật khẩu
```
http://localhost:3000/authentication/forgot-password
```

### 2. Nhập email và gửi
- Nhập email đã đăng ký trong hệ thống
- Click "Gửi mật khẩu mới"
- Chờ email chứa mật khẩu mới

### 3. Đăng nhập với mật khẩu mới
- Kiểm tra hộp thư (bao gồm thư mục spam)
- Sử dụng mật khẩu mới để đăng nhập
- Đổi mật khẩu ngay sau khi đăng nhập

## 🔗 API Endpoints

### POST /auth/forgot-password
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response Success:**
```json
{
  "message": "Đã gửi mật khẩu mới tới email của bạn"
}
```

**Response Error:**
```json
{
  "error": "Không tìm thấy người dùng với email này"
}
```

## 🎨 UI Components

### SuccessMessage Component
```javascript
<SuccessMessage
  title="Email đã được gửi thành công!"
  message="Mật khẩu mới đã được gửi tới email của bạn"
  actionText="Quay lại đăng nhập"
  onAction={() => navigate('/authentication/sign-in')}
  secondaryText="Thử lại"
  onSecondaryAction={() => setSuccess(false)}
/>
```

## ⚙️ Cấu hình

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000
```

### Backend Requirements
- Endpoint `/auth/forgot-password` phải hoạt động
- Email service phải được cấu hình
- Database connection phải ổn định

## 🐛 Xử lý lỗi

### Lỗi thường gặp
1. **Email không tồn tại**: Hiển thị thông báo lỗi
2. **Email không hợp lệ**: Validation client-side
3. **Lỗi server**: Hiển thị thông báo chung
4. **Network error**: Retry mechanism

### Debug
```javascript
// Bật debug mode
localStorage.setItem('debug', 'auth:*');

// Xem logs trong console
console.log('Auth debug enabled');
```

## 🔒 Bảo mật

- **Rate limiting** trên backend
- **Email validation** nghiêm ngặt
- **Không hiển thị** thông tin user trong error message
- **Token expiration** cho mật khẩu mới

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoints**: xs, sm, md, lg, xl
- **Touch-friendly** buttons và inputs
- **Accessibility** compliant

## 🧪 Testing

### Manual Testing
1. Test với email hợp lệ
2. Test với email không tồn tại
3. Test với email không hợp lệ
4. Test responsive trên mobile
5. Test loading states

### Test Cases
```javascript
// Valid email
test('should send reset email for valid email', async () => {
  // Test implementation
});

// Invalid email format
test('should show error for invalid email format', async () => {
  // Test implementation
});

// Non-existent email
test('should show error for non-existent email', async () => {
  // Test implementation
});
```

## 🚀 Deployment

### Build Production
```bash
npm run build
```

### Environment Setup
```bash
# Production
REACT_APP_API_URL=https://api.kidslink.com

# Staging
REACT_APP_API_URL=https://staging-api.kidslink.com
```

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Verify backend API hoạt động
3. Check network connectivity
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: KidsLink Development Team




