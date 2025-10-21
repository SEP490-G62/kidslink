# Hướng dẫn Debug - Lỗi không hiện giao diện

## Các bước kiểm tra

### 1. Kiểm tra Console Errors
Mở Developer Tools (F12) và kiểm tra tab Console:
- Có lỗi JavaScript nào không?
- Có lỗi import/export nào không?
- Có lỗi component nào không?

### 2. Kiểm tra Network Tab
- Có file nào load thất bại không?
- Có lỗi 404 cho các assets không?

### 3. Kiểm tra Routes
- Truy cập trực tiếp `/teacher` để xem có hoạt động không
- Kiểm tra xem ProtectedRoute có block không

### 4. Kiểm tra Authentication
- User có đăng nhập không?
- User có role `teacher` không?
- AuthContext có hoạt động không?

## Các lỗi thường gặp

### 1. Import Errors
```javascript
// Lỗi: Cannot resolve module
// Giải pháp: Kiểm tra đường dẫn import
import TeacherHome from "layouts/teacher"; // ✅ Đúng
import TeacherHome from "./layouts/teacher"; // ❌ Sai
```

### 2. Component Errors
```javascript
// Lỗi: Component is not defined
// Giải pháp: Kiểm tra export/import
export default TeacherHome; // ✅ Đúng
export TeacherHome; // ❌ Sai
```

### 3. ProtectedRoute Errors
```javascript
// Lỗi: User không có quyền truy cập
// Giải pháp: Kiểm tra role và authentication
const { user, isAuthenticated } = useAuth();
console.log('User:', user);
console.log('Is authenticated:', isAuthenticated());
```

### 4. CSS/Styling Errors
```javascript
// Lỗi: Styles không load
// Giải pháp: Kiểm tra import CSS
import "assets/css/nucleo-icons.css";
import "assets/css/nucleo-svg.css";
```

## Debug Steps

### Step 1: Kiểm tra Basic Route
```javascript
// Thay đổi route đơn giản
{
  type: "route",
  name: "Test",
  key: "test",
  route: "/test",
  component: <div>Test Component</div>,
}
```

### Step 2: Kiểm tra Teacher Route
```javascript
// Sử dụng TestTeacher component
import TestTeacher from "layouts/teacher/TestTeacher";
component: <TestTeacher />
```

### Step 3: Kiểm tra ProtectedRoute
```javascript
// Tạm thời bỏ ProtectedRoute
component: <TestTeacher />
// Thay vì
component: <ProtectedRoute requiredRoles={['teacher']}><TestTeacher /></ProtectedRoute>
```

### Step 4: Kiểm tra Authentication
```javascript
// Thêm debug trong AuthContext
console.log('Auth state:', { user, token, loading });
```

## Test Commands

### 1. Start Development Server
```bash
cd frond-end
npm start
```

### 2. Check Build
```bash
npm run build
```

### 3. Check Linting
```bash
npm run lint
```

## Common Solutions

### 1. Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Clear node_modules
rm -rf node_modules
npm install
```

### 2. Reset Development Server
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

### 3. Check Dependencies
```bash
# Check for missing dependencies
npm ls

# Install missing dependencies
npm install
```

## Debug Checklist

- [ ] Console có lỗi không?
- [ ] Network tab có lỗi không?
- [ ] Routes có được register không?
- [ ] Components có import đúng không?
- [ ] ProtectedRoute có hoạt động không?
- [ ] Authentication có hoạt động không?
- [ ] CSS có load không?
- [ ] Icons có hiển thị không?

## Contact

Nếu vẫn có lỗi, hãy cung cấp:
1. Screenshot của Console errors
2. Screenshot của Network tab
3. Code của component bị lỗi
4. Steps để reproduce lỗi



