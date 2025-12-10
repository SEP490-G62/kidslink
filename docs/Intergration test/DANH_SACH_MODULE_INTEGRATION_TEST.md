# DANH SÁCH MODULE CODE CHO INTEGRATION TEST
## Dự án KidsLink - Hệ thống quản lý trường mầm non

---

## 📋 TỔNG QUAN
Danh sách này liệt kê tất cả các module code cần thực hiện integration test, được phân loại theo vai trò người dùng và chức năng nghiệp vụ.

**Ngày tạo:** 7/12/2025  
**Tổng số module:** 15 modules chính  
**Tổng số endpoints:** ~150+ API endpoints

---

## 📑 FORM MẪU CHO INTEGRATION TEST (ÁP DỤNG THEO FILE EXCEL)

| Test Case ID | Module | Test Case Title/Description | Preconditions | Test Data | Steps / Procedure | Expected Results | Priority | Type (Happy/Negative/Regression/Smoke) | Round 1 (Result/Date/Tester) | Round 2 (Result/Date/Tester) | Round 3 (Result/Date/Tester) | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | Auth | Register success | User not logged in | email=testA@ex.com, pass=Abc@1234 | 1. Call POST /auth/register with data 2. Verify response 200 | 201/200, token returned, user created in DB | High | Happy | | | | |

**Hướng dẫn điền form:**
- **Preconditions:** nêu rõ account/role, dữ liệu có sẵn (ID lớp, school_id, contract_id...).
- **Test Data:** liệt kê tham số cụ thể (body, query, path params, file upload).
- **Steps:** ngắn gọn, có thứ tự; nếu dùng API, ghi rõ endpoint + phương thức.
- **Expected Results:** gồm HTTP status, message, và state DB (record được tạo/cập nhật/xóa, trường nào).
- **Priority/Type:** dùng để chọn test chạy smoke/regression.
- **Round 1/2/3:** ghi Passed/Failed + ngày + tester; nếu Failed, link defect ở Note.

---

## 🧪 BỘ TEST CASE MẪU (CÓ THỂ DÙNG LÀM KHUNG CHO TỪNG MODULE)

### Module: Authentication & Authorization (Auth)
| Test Case ID | Test Case Description | Preconditions | Test Data | Steps / Procedure | Expected Results | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | Register success | Chưa đăng nhập | email uniq, pass hợp lệ | 1) POST /auth/register body {email, password, role} 2) Verify response | 201/200, trả token/ID user; user lưu DB với role; mật khẩu hash | High | Happy |
| AUTH-02 | Register validation error | Chưa đăng nhập | email sai format | 1) POST /auth/register với email sai 2) Verify response | 400 validation error message | High | Negative |
| AUTH-03 | Login success | User đã tồn tại, active | email/pass đúng | 1) POST /auth/login 2) Verify token 3) Gọi GET /users/me với token | 200, trả access token; /users/me trả thông tin user | Critical | Happy |
| AUTH-04 | Login wrong password | User tồn tại | email đúng, pass sai | POST /auth/login | 401, message sai thông tin đăng nhập; không cấp token | Critical | Negative |
| AUTH-05 | Access protected without token | API bất kỳ yêu cầu auth | Không token | GET /users/me không header Authorization | 401 unauthorized | Critical | Negative |
| AUTH-06 | Access protected with wrong role (RBAC) | User role parent | Token parent | PUT /users/any-id | 403 forbidden | High | Negative |
| AUTH-07 | Rate limit check | Đặt windowMs như cấu hình | Gửi >100 req/15m | Lặp POST /auth/login | 429 quá nhiều requests | Medium | Negative |
| AUTH-08 | Forgot password flow | User tồn tại | email hợp lệ | POST /auth/forgot-password | 200 message gửi email reset (mock), audit log | Medium | Happy |

### Module: User Management
| Test Case ID | Test Case Description | Preconditions | Test Data | Steps / Procedure | Expected Results | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- |
| USER-01 | Get current user | Đăng nhập với mọi role | Bearer token | GET /users/me | 200, trả thông tin user đúng role/school | Critical | Happy |
| USER-02 | Update current user | User login | name/phone hợp lệ | PUT /users/me | 200, DB cập nhật, trả dữ liệu mới | High | Happy |
| USER-03 | Change password | User login | old/new password | PUT /users/change-password | 200, có thể login với mật khẩu mới, cũ không dùng được | Critical | Happy |
| USER-04 | List users (admin only) | Token admin/school_admin | query: page,size,filters | GET /users | 200, dữ liệu phân trang, filter đúng; parent/teacher bị chặn (403) | Critical | Happy/Negative |
| USER-05 | Create user by school admin | Token school_admin | body user teacher/parent | POST /users | 201, user thuộc school của admin; admin khác school không thấy | Critical | Happy |
| USER-06 | Soft delete user | Token admin/school_admin | user id | DELETE /users/:id | 200, user.status=deleted; không login được | High | Happy |
| USER-07 | Restore user | User deleted | user id | PUT /users/:id/restore | 200, user active lại, login được | High | Happy |
| USER-08 | Hard delete user | Token admin | user id | DELETE /users/:id/hard | 200, record biến mất; liên kết foreign key xử lý an toàn | Medium | Happy |
| USER-09 | Role-based access regression | Nhiều role | tokens các role | Gọi một loạt endpoints cross-role | Các endpoint chặn đúng role (401/403) | Critical | Regression |

### Cách dùng
- Sao chép bảng mẫu trên cho từng module còn lại (Class, Student, Teacher, Parent, Calendar, Fee, Messaging...).
- Giữ cột theo form Excel: có thể thêm cột Round 1/2/3, Tester, Date, Note khi xuất sang Excel/TSV.
- Với mỗi endpoint, tối thiểu có: Happy path, Validation error, Unauthorized/Forbidden, Business rule edge case.

---

## 🔐 MODULE 1: AUTHENTICATION & AUTHORIZATION
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/auth`

### Endpoints cần test:
- POST `/auth/register` - Đăng ký tài khoản mới
- POST `/auth/login` - Đăng nhập
- POST `/auth/forgot-password` - Quên mật khẩu

### Integration Test Cases:
1. **Auth Flow Integration**
   - Register → Login → Access Protected Routes
   - Invalid credentials handling
   - Token expiration & refresh
   - Role-based access control (RBAC)

2. **Security Integration**
   - Rate limiting test
   - CORS policy validation
   - Password encryption verification
   - Session management across modules

### Dependencies:
- Database: Users table
- Services: JWT, bcrypt, email service
- Related modules: All protected routes

---

## 👤 MODULE 2: USER MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/users`  
**Roles:** school_admin, admin

### Endpoints cần test:
- GET `/users/me` - Lấy thông tin user hiện tại (all roles)
- PUT `/users/me` - Cập nhật thông tin cá nhân (all roles)
- PUT `/users/change-password` - Đổi mật khẩu (all roles)
- GET `/users` - Lấy danh sách users (admin/school_admin)
- GET `/users/:id` - Lấy user theo ID
- POST `/users` - Tạo user mới
- PUT `/users/:id` - Cập nhật user
- DELETE `/users/:id` - Soft delete user
- DELETE `/users/:id/hard` - Hard delete user
- PUT `/users/:id/restore` - Khôi phục user

### Integration Test Cases:
1. **User CRUD Flow**
   - Create → Read → Update → Delete → Restore
   - School admin tạo users cho trường của mình
   - Admin tạo users cho tất cả trường

2. **Role Management Integration**
   - Tạo user với các role khác nhau (teacher, parent, health_care_staff, nutrition_staff)
   - Verify permissions theo role
   - Update role và test access changes

3. **User Profile Integration**
   - User tự update profile
   - Upload avatar integration
   - Change password flow

### Dependencies:
- Database: Users, Schools
- Related modules: Auth, School Management

---

## 🏫 MODULE 3: SCHOOL MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URLs:** `/admin/schools`, `/school-admin/school`

### Endpoints cần test:

#### Admin School Routes (`/admin/schools`):
- GET `/admin/schools` - Lấy tất cả trường (admin)
- GET `/admin/schools/:schoolId` - Lấy thông tin trường
- POST `/admin/schools` - Tạo trường mới
- PUT `/admin/schools/:schoolId` - Cập nhật trường
- DELETE `/admin/schools/:schoolId` - Xóa trường
- PUT `/admin/schools/:schoolId/status` - Cập nhật trạng thái

#### School Admin Routes (`/school-admin/school`):
- GET `/school-admin/school/:schoolId?` - Lấy thông tin trường của mình
- PUT `/school-admin/school/:schoolId?` - Cập nhật thông tin trường

### Integration Test Cases:
1. **School Lifecycle**
   - Create school → Add users → Add classes → Activate/Deactivate
   - Multi-school data isolation test

2. **School Admin Permission Test**
   - School admin chỉ thấy/sửa trường của mình
   - Admin có thể quản lý tất cả trường

### Dependencies:
- Database: Schools, Users, Classes
- Related modules: User Management, Class Management

---

## 📚 MODULE 4: CLASS MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/classes`  
**Roles:** school_admin, admin

### Endpoints cần test:
- GET `/classes` - Lấy danh sách lớp
- GET `/classes/:id` - Lấy thông tin lớp
- POST `/classes` - Tạo lớp mới
- PUT `/classes/:id` - Cập nhật lớp
- DELETE `/classes/:id` - Xóa lớp
- POST `/classes/:id/promote` - Lên lớp
- GET `/classes/:classId/eligible-students` - Lấy học sinh đủ điều kiện
- POST `/classes/:classId/students` - Thêm học sinh vào lớp
- DELETE `/classes/:classId/students/:studentId` - Xóa học sinh khỏi lớp

### Integration Test Cases:
1. **Class Lifecycle Flow**
   - Create class → Add students → Assign teacher → Update info → Promote class
   - Delete class with/without students

2. **Class-Student Management**
   - Add multiple students to class
   - Transfer student between classes
   - Remove student from class
   - Check eligible students logic

3. **Class Age Integration**
   - Create class với class_age_id
   - Verify class age constraints

### Dependencies:
- Database: Classes, Students, Teachers, ClassAge, StudentClass
- Related modules: Student Management, Teacher Management, ClassAge

---

## 📖 MODULE 5: CLASS AGE MANAGEMENT
**Priority:** ⭐⭐ (High)  
**Base URL:** `/class-ages`  
**Roles:** school_admin, admin

### Endpoints cần test:
- GET `/class-ages` - Lấy danh sách khối tuổi (all authenticated)
- POST `/class-ages` - Tạo khối tuổi mới (admin/school_admin)
- PUT `/class-ages/:id` - Cập nhật khối tuổi
- DELETE `/class-ages/:id` - Xóa khối tuổi

### Integration Test Cases:
1. **ClassAge-Class Integration**
   - Create class age → Create classes with that age → Update age → Delete (should handle cascade)

2. **ClassAge-Menu Integration**
   - Class age với nutrition menu
   - Verify menu theo class age

### Dependencies:
- Database: ClassAge, Classes, ClassAgeMeals
- Related modules: Class Management, Nutrition

---

## 👶 MODULE 6: STUDENT MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/student`  
**Roles:** school_admin, admin, teacher, parent

### Endpoints cần test:
- GET `/student/all` - Lấy tất cả học sinh (authenticated)
- GET `/student/class/:classId` - Lấy học sinh theo lớp (authenticated)
- GET `/student/:id` - Lấy chi tiết học sinh (authenticated)
- POST `/student` - Tạo học sinh (admin/school_admin)
- PUT `/student/:id` - Cập nhật học sinh (admin/school_admin)
- POST `/student/:id/transfer` - Chuyển lớp (admin/school_admin)
- PATCH `/student/:id/status` - Thay đổi trạng thái (admin/school_admin)
- POST `/student/:id/parents` - Thêm phụ huynh (admin/school_admin)
- DELETE `/student/:id/parents/:parentId` - Xóa phụ huynh (admin/school_admin)
- DELETE `/student/:id` - Xóa học sinh (admin/school_admin)

### Integration Test Cases:
1. **Student Lifecycle**
   - Create student → Assign to class → Link parents → Transfer → Update status → Delete

2. **Student-Parent Relationship**
   - Add multiple parents to student
   - Remove parent from student
   - Verify parent can only see their children

3. **Student-Class Integration**
   - Transfer student between classes
   - Promote student with class
   - Student in multiple classes (edge case)

4. **Student Data Access**
   - Teacher can view students in their class only
   - Parent can view their children only
   - School admin can view all students in school

### Dependencies:
- Database: Students, Parents, ParentStudent, Classes, StudentClass
- Related modules: Class, Parent, Teacher

---

## 👨‍🏫 MODULE 7: TEACHER MANAGEMENT & FUNCTIONS
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/teachers`  
**Role:** teacher

### Endpoints cần test:

#### Profile:
- GET `/teachers/profile` - Xem profile
- PUT `/teachers/profile` - Cập nhật profile
- POST `/teachers/profile/avatar` - Upload avatar

#### Class Management:
- GET `/teachers/class` - Xem lớp của mình
- GET `/teachers/class/students` - Xem danh sách học sinh
- GET `/teachers/class/students/attendance/:date` - Xem điểm danh theo ngày
- GET `/teachers/students/:id` - Xem chi tiết học sinh
- POST `/teachers/class/chat-group` - Tạo nhóm chat lớp

#### Calendar:
- GET `/teachers/class-calendar` - Xem lịch học lớp
- GET `/teachers/teaching-calendar` - Xem lịch dạy
- GET `/teachers/class-calendar/slots` - Xem khung giờ

#### Daily Reports (Check-in/out):
- POST `/teachers/daily-reports/checkin` - Điểm danh vào
- PUT `/teachers/daily-reports/checkout` - Điểm danh ra
- PUT `/teachers/daily-reports/:id/comment` - Cập nhật nhận xét
- GET `/teachers/students/:student_id/daily-reports/weekly` - Xem báo cáo tuần

#### Posts (Teacher):
- GET `/teachers/posts` - Xem tất cả bài đăng
- GET `/teachers/posts/my-posts` - Xem bài đăng của mình
- POST `/teachers/posts` - Tạo bài đăng
- PUT `/teachers/posts/:postId` - Sửa bài đăng
- DELETE `/teachers/posts/:postId` - Xóa bài đăng

#### Likes & Comments:
- POST `/teachers/posts/:postId/like` - Like/unlike bài đăng
- GET `/teachers/posts/:postId/likes` - Xem likes
- POST `/teachers/posts/:postId/comments` - Comment bài đăng
- GET `/teachers/posts/:postId/comments` - Xem comments
- PUT `/teachers/comments/:commentId` - Sửa comment
- DELETE `/teachers/comments/:commentId` - Xóa comment

#### Complaints:
- GET `/teachers/complaints/types` - Xem loại khiếu nại
- POST `/teachers/complaints` - Tạo khiếu nại
- GET `/teachers/complaints` - Xem khiếu nại của mình
- GET `/teachers/complaints/:complaintId` - Xem chi tiết khiếu nại

### Integration Test Cases:
1. **Teacher Daily Workflow**
   - Login → View class → Check-in students → Update comments → Check-out → View reports

2. **Teacher-Student Interaction**
   - View student details → Check attendance → Create daily report → Add comments

3. **Teacher-Parent Communication**
   - Create post → Parent views → Parent comments → Teacher replies
   - Create class chat group → Send messages

4. **Teacher Calendar Integration**
   - View teaching calendar → View class calendar → View time slots

### Dependencies:
- Database: Teachers, Classes, Students, DailyReports, Posts, Comments, Complaints
- Related modules: Class, Student, Daily Reports, Messaging, Posts

---

## 👨‍👩‍👧 MODULE 8: PARENT MANAGEMENT & FUNCTIONS
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/parent`  
**Role:** parent

### Endpoints cần test:

#### Children Info:
- GET `/parent/children` - Xem danh sách con
- GET `/parent/child-info/:studentId` - Xem thông tin chi tiết con

#### Personal Info:
- GET `/parent/personal-info` - Xem thông tin cá nhân
- PUT `/parent/personal-info` - Cập nhật thông tin

#### Daily Reports:
- GET `/parent/daily-reports` - Xem báo cáo ngày của con

#### Calendar:
- GET `/parent/class-calendar` - Xem lịch học lớp
- GET `/parent/class-calendar/slots` - Xem khung giờ

#### Menu:
- GET `/parent/menu` - Xem thực đơn tuần

#### Posts:
- GET `/parent/posts` - Xem bài đăng
- GET `/parent/posts/my-posts` - Xem bài đăng của mình
- POST `/parent/posts` - Tạo bài đăng
- PUT `/parent/posts/:postId` - Sửa bài đăng
- DELETE `/parent/posts/:postId` - Xóa bài đăng

#### Likes & Comments:
- POST `/parent/posts/:postId/like` - Like bài đăng
- GET `/parent/posts/:postId/likes` - Xem likes
- POST `/parent/posts/:postId/comments` - Comment
- GET `/parent/posts/:postId/comments` - Xem comments
- PUT `/parent/comments/:commentId` - Sửa comment
- DELETE `/parent/comments/:commentId` - Xóa comment

#### Pickups (Người đón):
- POST `/parent/pickups/:studentId` - Thêm người đón
- PUT `/parent/pickups/:pickupId/:studentId` - Sửa người đón
- DELETE `/parent/pickups/:pickupId/:studentId` - Xóa người đón

#### Complaints:
- GET `/parent/complaints/types` - Xem loại khiếu nại
- POST `/parent/complaints` - Tạo khiếu nại
- GET `/parent/complaints` - Xem khiếu nại của mình
- GET `/parent/complaints/:complaintId` - Chi tiết khiếu nại

#### Fees:
- GET `/parent/fees` - Xem học phí
- POST `/parent/fees/payos` - Tạo yêu cầu thanh toán PayOS
- POST `/parent/fees/payos/status` - Kiểm tra trạng thái thanh toán

### Integration Test Cases:
1. **Parent Daily Workflow**
   - Login → View children → Check daily reports → View menu → View calendar

2. **Parent-Child Data Access**
   - Parent chỉ thấy data của con mình
   - Multiple children handling
   - Child info privacy test

3. **Parent-Teacher Interaction**
   - View posts from teacher → Comment → Like
   - Create complaint → Teacher/Admin resolve

4. **Pickup Management Flow**
   - Add pickup person → Update → Delete → Verify at check-out

5. **Fee Payment Integration**
   - View fees → Create payment request → PayOS webhook → Update status → View invoice

### Dependencies:
- Database: Parents, Students, ParentStudent, Posts, Pickups, Fees, Invoices
- Related modules: Student, Posts, Fees, Pickups, Payment Gateway

---

## 🏥 MODULE 9: HEALTH CARE STAFF
**Priority:** ⭐⭐ (High)  
**Base URL:** `/health-staff`  
**Role:** health_care_staff

### Endpoints cần test:

#### Classes & Students:
- GET `/health-staff/classes` - Xem danh sách lớp
- GET `/health-staff/classes/:class_id/students` - Xem học sinh theo lớp

#### Health Records:
- GET `/health-staff/health/records` - Xem sổ sức khỏe (query: student_id)
- POST `/health-staff/health/records` - Tạo bản ghi sức khỏe
- PUT `/health-staff/health/records/:record_id` - Cập nhật
- DELETE `/health-staff/health/records/:record_id` - Xóa

#### Health Notices:
- GET `/health-staff/health/notices` - Xem thông báo y tế (query: student_id)
- POST `/health-staff/health/notices` - Tạo thông báo
- PUT `/health-staff/health/notices/:notice_id` - Cập nhật
- DELETE `/health-staff/health/notices/:notice_id` - Xóa

#### Profile:
- GET `/health-staff/profile` - Xem profile
- PUT `/health-staff/profile` - Cập nhật profile
- PUT `/health-staff/change-password` - Đổi mật khẩu

### Integration Test Cases:
1. **Health Record Management Flow**
   - View students → Select student → Create health record → Update → Delete

2. **Health Notice Integration**
   - Create health notice → Parent views notification → Verify visibility

3. **Multi-student Health Tracking**
   - Create records for multiple students
   - Query records by student
   - Bulk health check scenarios

### Dependencies:
- Database: HealthRecords, HealthNotices, Students, Classes
- Related modules: Student, Parent (notifications)

---

## 🍽️ MODULE 10: NUTRITION STAFF
**Priority:** ⭐⭐ (High)  
**Base URL:** `/nutrition`  
**Role:** nutrition_staff

### Endpoints cần test:

#### Dishes (Món ăn):
- GET `/nutrition/dishes` - Danh sách món ăn
- POST `/nutrition/dishes` - Tạo món ăn
- PUT `/nutrition/dishes/:id` - Cập nhật món ăn
- DELETE `/nutrition/dishes/:id` - Xóa món ăn

#### Class Ages & Meals:
- GET `/nutrition/class-ages` - Danh sách nhóm tuổi
- GET `/nutrition/meals` - Danh sách bữa ăn
- GET `/nutrition/weekdays` - Danh sách ngày trong tuần

#### Menu Assignment:
- GET `/nutrition/class-age-meals` - Lịch thực đơn (query: class_age_id, meal_id, date)
- POST `/nutrition/class-age-meals/assign` - Gán món ăn cho bữa
- GET `/nutrition/class-age-meals/dishes` - Xem món đã gán
- GET `/nutrition/class-age-meals/weekly-dishes` - Xem món cả tuần

#### Profile:
- GET `/nutrition/profile` - Xem profile
- PUT `/nutrition/profile` - Cập nhật profile
- PUT `/nutrition/change-password` - Đổi mật khẩu

### Integration Test Cases:
1. **Weekly Menu Creation Flow**
   - Create dishes → Assign to meals → Create weekly menu → Parent views

2. **Menu Assignment Integration**
   - Assign multiple dishes to meal
   - Update dish in existing menu
   - Delete dish (verify menu updates)

3. **Multi-ClassAge Menu**
   - Create different menus for different age groups
   - Verify parents see correct menu for their child's age

4. **Weekly Menu Query**
   - Get full weekly menu
   - Filter by date, meal, class age

### Dependencies:
- Database: Dishes, Meals, ClassAgeMeals, DishesClassAgeMeals, ClassAge, WeekDays
- Related modules: ClassAge, Parent (menu viewing)

---

## 📅 MODULE 11: CALENDAR & SCHEDULE MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/school-admin/calendar`  
**Roles:** school_admin, admin

### Endpoints cần test:

#### Calendar Entries:
- GET `/school-admin/calendar/class/:classId` - Xem lịch lớp
- POST `/school-admin/calendar/calendar/:calendarId` - Tạo/cập nhật entry
- POST `/school-admin/calendar/calendar/bulk` - Tạo hàng loạt
- DELETE `/school-admin/calendar/calendar/:calendarId` - Xóa entry

#### Slots (Khung giờ):
- GET `/school-admin/calendar/slots` - Xem tất cả slots
- POST `/school-admin/calendar/slots` - Tạo slot mới
- PUT `/school-admin/calendar/slots/:slotId` - Cập nhật slot
- DELETE `/school-admin/calendar/slots/:slotId` - Xóa slot
- POST `/school-admin/calendar/slots/update-names` - Cập nhật tên hàng loạt

#### Activities:
- GET `/school-admin/calendar/activities` - Danh sách hoạt động
- POST `/school-admin/calendar/activities` - Tạo hoạt động
- PUT `/school-admin/calendar/activities/:activityId` - Cập nhật
- DELETE `/school-admin/calendar/activities/:activityId` - Xóa

#### Teachers:
- GET `/school-admin/calendar/teachers` - Danh sách giáo viên

### Integration Test Cases:
1. **Calendar Setup Flow**
   - Create slots → Create activities → Assign to class calendar → Teacher/Parent view

2. **Bulk Calendar Creation**
   - Create full week schedule for multiple classes
   - Update schedule for entire week

3. **Slot-Activity-Calendar Integration**
   - Create slot → Create activity → Assign both to calendar entry → Verify in teacher/parent view

4. **Teacher Assignment Integration**
   - Assign teacher to calendar entry → Teacher sees in their schedule

### Dependencies:
- Database: Calendars, Slots, Activities, Classes, Teachers, WeekDays
- Related modules: Class, Teacher, Parent

---

## 📝 MODULE 12: POSTS & SOCIAL FEATURES
**Priority:** ⭐⭐⭐ (Critical)  
**Base URLs:** `/school-admin/posts`, `/teachers/posts`, `/parent/posts`

### Endpoints cần test:

#### School Admin Posts:
- GET `/school-admin/posts` - Xem tất cả posts (pending, approved, rejected)
- GET `/school-admin/posts/:postId` - Chi tiết post
- POST `/school-admin/posts` - Tạo post
- PUT `/school-admin/posts/:postId` - Cập nhật post
- PUT `/school-admin/posts/:postId/status` - Duyệt/từ chối post
- DELETE `/school-admin/posts/:postId` - Xóa post

#### Comments (All roles):
- GET `/posts/:postId/comments` - Xem comments
- POST `/posts/:postId/comments` - Tạo comment
- PUT `/comments/:commentId` - Sửa comment
- DELETE `/comments/:commentId` - Xóa comment

#### Likes (All roles):
- POST `/posts/:postId/like` - Like/unlike
- GET `/posts/:postId/likes` - Xem likes

### Integration Test Cases:
1. **Post Approval Workflow**
   - Parent/Teacher create post (pending) → School admin reviews → Approve/Reject → Post visible/hidden

2. **Multi-role Post Interaction**
   - Teacher creates post → Parent views → Parent comments → Teacher replies → Admin moderates

3. **Post Privacy & Visibility**
   - Approved posts visible to all school users
   - Pending posts visible to creator only
   - Rejected posts handling

4. **Like & Comment Integration**
   - Multiple users like post
   - Nested comments (if supported)
   - Delete post → verify comments/likes cascade

5. **Post Images Integration**
   - Upload images with post
   - Update post with new images
   - Delete post with images

### Dependencies:
- Database: Posts, PostComments, PostLikes, PostImages, Users
- Related modules: User, School

---

## 💰 MODULE 13: FEE & PAYMENT MANAGEMENT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/school-admin/fees`, `/parent/fees`, `/payos`

### Endpoints cần test:

#### Fee Management (School Admin):
- GET `/school-admin/fees` - Xem tất cả phí (authenticated)
- GET `/school-admin/fees/:id` - Chi tiết phí
- POST `/school-admin/fees` - Tạo phí mới
- PUT `/school-admin/fees/:id` - Cập nhật phí
- DELETE `/school-admin/fees/:id` - Xóá phí

#### Class Fee & Payments:
- GET `/school-admin/fees/:id/classes/:classFeeId/payments` - Xem thanh toán lớp
- POST `/school-admin/fees/:id/classes/:classFeeId/students/:studentClassId/invoice` - Tạo invoice
- POST `/school-admin/fees/:id/classes/:classFeeId/payments/:invoiceId/offline` - Thanh toán offline

#### Parent Fee View:
- GET `/parent/fees` - Xem học phí con
- POST `/parent/fees/payos` - Tạo yêu cầu thanh toán
- POST `/parent/fees/payos/status` - Kiểm tra trạng thái

#### PayOS Webhook:
- POST `/payos/webhook` - Nhận webhook từ PayOS

### Integration Test Cases:
1. **Fee Lifecycle**
   - Create fee → Assign to classes → Generate invoices → Students view → Payment

2. **Online Payment Flow**
   - Parent requests payment → PayOS processes → Webhook received → Invoice updated → Status visible

3. **Offline Payment Flow**
   - School admin marks invoice as paid offline → Invoice status updated → Parent sees paid status

4. **Late Payment Surcharge**
   - Invoice overdue → Auto calculate surcharge → Parent sees increased amount

5. **Multi-student Fee Management**
   - Create fee for class → All students get invoices → Track payment status

6. **Payment Reconciliation**
   - Match PayOS transactions with invoices
   - Handle payment failures
   - Refund scenarios

### Dependencies:
- Database: Fees, ClassFees, Invoices, Payments, Students, Classes
- External: PayOS payment gateway
- Related modules: Student, Class, Parent

---

## 📢 MODULE 14: COMPLAINT MANAGEMENT
**Priority:** ⭐⭐ (High)  
**Base URL:** `/school-admin/complaints`, `/parent/complaints`, `/teachers/complaints`

### Endpoints cần test:

#### School Admin:
- GET `/school-admin/complaints/stats` - Thống kê khiếu nại
- GET `/school-admin/complaints` - Danh sách khiếu nại
- GET `/school-admin/complaints/:complaintId` - Chi tiết
- PUT `/school-admin/complaints/:complaintId/approve` - Duyệt
- PUT `/school-admin/complaints/:complaintId/reject` - Từ chối

#### Complaint Types (School Admin):
- GET `/school-admin/complaints/types/list` - Danh sách loại
- POST `/school-admin/complaints/types` - Tạo loại mới
- PUT `/school-admin/complaints/types/:typeId` - Cập nhật
- DELETE `/school-admin/complaints/types/:typeId` - Xóa

#### Parent & Teacher:
- GET `/complaints/types` - Xem loại khiếu nại
- POST `/complaints` - Tạo khiếu nại
- GET `/complaints` - Xem khiếu nại của mình
- GET `/complaints/:complaintId` - Chi tiết

### Integration Test Cases:
1. **Complaint Flow**
   - Parent/Teacher create complaint → School admin views → Approve/Reject → Notification to creator

2. **Complaint Type Management**
   - Create types → Users select type when creating complaint → Delete type (handle existing complaints)

3. **Complaint Statistics**
   - Create multiple complaints → View stats by status, type, date range

4. **Multi-user Complaint Handling**
   - Multiple users create complaints → School admin processes in order

### Dependencies:
- Database: Complaints, ComplaintTypes, Users
- Related modules: User, Notification (if exists)

---

## 💬 MODULE 15: MESSAGING & CHAT
**Priority:** ⭐⭐⭐ (Critical)  
**Base URL:** `/api/messaging`  
**Technology:** Socket.IO + REST API

### Endpoints cần test:

#### Conversations:
- POST `/api/messaging/conversations` - Tạo conversation
- GET `/api/messaging/conversations` - Lấy danh sách conversations
- GET `/api/messaging/conversations/:conversation_id` - Chi tiết conversation
- POST `/api/messaging/conversations/:conversation_id/participants` - Thêm người tham gia
- POST `/api/messaging/conversations/direct` - Tạo conversation trực tiếp với giáo viên

#### Messages:
- GET `/api/messaging/conversations/:conversation_id/messages` - Lấy tin nhắn
- POST `/api/messaging/messages` - Gửi tin nhắn
- PUT `/api/messaging/conversations/:conversation_id/read` - Đánh dấu đã đọc
- GET `/api/messaging/unread-count` - Đếm tin chưa đọc

#### Helpers:
- GET `/api/messaging/teachers-by-student/:student_id` - Lấy giáo viên của học sinh
- GET `/api/messaging/parents-by-teacher-class` - Lấy phụ huynh trong lớp

### Integration Test Cases:
1. **Chat Flow (REST API)**
   - Create conversation → Send messages → Receive messages → Mark as read

2. **Real-time Chat (Socket.IO)**
   - User A connects → User B connects → User A sends message → User B receives instantly
   - Test disconnect/reconnect scenarios

3. **Parent-Teacher Chat**
   - Parent finds teachers of their child → Create direct conversation → Chat

4. **Group Chat (Class)**
   - Teacher creates class chat → All parents join → Teacher broadcasts message → All receive

5. **Message Persistence**
   - Send messages → Disconnect → Reconnect → Retrieve message history

6. **Unread Count**
   - Receive messages → Check unread count → Mark as read → Count updates

7. **Image Sharing**
   - Send image in chat → Verify upload → Recipient views image

### Dependencies:
- Database: Conversations, ConversationParticipants, Messages
- Technology: Socket.IO, File upload
- Related modules: Teacher, Parent, Student

---

## 🎯 PRIORITY MATRIX

### ⭐⭐⭐ CRITICAL (Làm trước tiên):
1. Authentication & Authorization
2. User Management
3. School Management
4. Class Management
5. Student Management
6. Teacher Management & Functions
7. Parent Management & Functions
8. Calendar & Schedule Management
9. Posts & Social Features
10. Fee & Payment Management
11. Messaging & Chat

### ⭐⭐ HIGH (Làm sau):
12. Class Age Management
13. Health Care Staff
14. Nutrition Staff
15. Complaint Management

---

## 📊 INTEGRATION TEST SCENARIOS (CROSS-MODULE)

### Scenario 1: School Setup & Operations
**Flow:** Admin creates school → School admin creates classes → Adds teachers → Adds students → Links parents → Creates calendar → Sets fees

**Modules involved:**
- School Management
- User Management
- Class Management
- Student Management
- Calendar Management
- Fee Management

### Scenario 2: Daily Teacher Workflow
**Flow:** Teacher logs in → Views class → Check-in students → Updates daily reports → Posts announcement → Chats with parents

**Modules involved:**
- Authentication
- Teacher Management
- Student Management
- Daily Reports
- Posts
- Messaging

### Scenario 3: Parent Daily Monitoring
**Flow:** Parent logs in → Views children → Checks daily reports → Views menu → Checks calendar → Pays fees → Chats with teacher

**Modules involved:**
- Authentication
- Parent Management
- Student Management
- Daily Reports
- Nutrition
- Calendar
- Fee & Payment
- Messaging

### Scenario 4: Weekly Menu Creation & Distribution
**Flow:** Nutrition staff creates dishes → Assigns to weekly menu → Parents view menu for their children's age group

**Modules involved:**
- Nutrition Management
- Class Age Management
- Parent Management

### Scenario 5: Fee Collection & Payment
**Flow:** School admin creates fee → System generates invoices → Parents pay online/offline → School admin verifies payments

**Modules involved:**
- Fee Management
- Payment Gateway (PayOS)
- Parent Management
- Student Management

### Scenario 6: Complaint Resolution
**Flow:** Parent/Teacher creates complaint → School admin reviews → Approves/Rejects → Notification sent

**Modules involved:**
- Complaint Management
- User Management
- Notification (if exists)

---

## 🧪 TEST ENVIRONMENT REQUIREMENTS

### Database:
- Separate test database
- Test data seeding scripts
- Transaction rollback after each test

### External Services:
- PayOS sandbox environment
- Email service mock/sandbox
- File storage (local/test bucket)

### Authentication:
- Test accounts for each role:
  - admin
  - school_admin
  - teacher
  - parent
  - health_care_staff
  - nutrition_staff

### Socket.IO:
- Socket.IO test client
- Multiple concurrent connection tests

---

## 📝 TEST DATA REQUIREMENTS

### Master Data:
- 2-3 schools
- 3-5 class ages
- 5-10 classes per school
- 20-30 students per class
- 2-3 teachers per class
- 2 parents per student

### Transaction Data:
- Daily reports (1 week)
- Posts (10-20)
- Messages (50-100)
- Fees (2-3 per term)
- Health records (5-10 per student)
- Weekly menus (4 weeks)

---

## 🔧 TESTING TOOLS RECOMMENDED

1. **API Testing:** 
   - Jest + Supertest
   - Postman/Newman

2. **Database:**
   - SQL transactions
   - Database seeding

3. **Mocking:**
   - Sinon.js (for external services)
   - Mock Socket.IO client

4. **Test Coverage:**
   - Istanbul/NYC
   - Coverage target: >80%

---

## 📌 NOTES

1. **Test Order:** Tuân theo dependency graph. Test các module foundation trước (Auth, User, School)

2. **Data Isolation:** Mỗi test case phải có test data riêng, không chia sẻ data giữa các test

3. **Cleanup:** Sau mỗi test suite, cleanup test data hoặc dùng transaction rollback

4. **Error Cases:** Test cả happy path và error cases (invalid data, unauthorized access, etc.)

5. **Performance:** Đo thời gian response cho các API quan trọng

6. **Security:** Test authentication, authorization, CORS, rate limiting trong integration test

---

## ✅ COMPLETION CHECKLIST

Để đánh dấu module đã hoàn thành integration test:

- [ ] Module 1: Authentication & Authorization
- [ ] Module 2: User Management
- [ ] Module 3: School Management
- [ ] Module 4: Class Management
- [ ] Module 5: Class Age Management
- [ ] Module 6: Student Management
- [ ] Module 7: Teacher Management & Functions
- [ ] Module 8: Parent Management & Functions
- [ ] Module 9: Health Care Staff
- [ ] Module 10: Nutrition Staff
- [ ] Module 11: Calendar & Schedule Management
- [ ] Module 12: Posts & Social Features
- [ ] Module 13: Fee & Payment Management
- [ ] Module 14: Complaint Management
- [ ] Module 15: Messaging & Chat

### Cross-Module Scenarios:
- [ ] Scenario 1: School Setup & Operations
- [ ] Scenario 2: Daily Teacher Workflow
- [ ] Scenario 3: Parent Daily Monitoring
- [ ] Scenario 4: Weekly Menu Creation & Distribution
- [ ] Scenario 5: Fee Collection & Payment
- [ ] Scenario 6: Complaint Resolution

---

**Last Updated:** 7/12/2025  
**Document Owner:** QA/Test Team  
**Version:** 1.0
