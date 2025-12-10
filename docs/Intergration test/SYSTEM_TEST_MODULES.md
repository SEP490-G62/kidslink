# SYSTEM TEST - MODULE CODE OVERVIEW
## Dự án KidsLink - Hệ thống quản lý trường mầm non

**Ngày tạo:** 7/12/2025  
**Loại test:** System Test (End-to-End)  
**Tổng số module:** 5 module chính

---

## 📋 TỔNG QUAN CÁC MODULE CODE

| No | Module Code | Description | Priority | Number of Test Cases (Est.) |
|----|-------------|-------------|----------|---------------------------|
| 1 | User & Authentication Process | Đăng ký, đăng nhập, quản lý người dùng, phân quyền | Critical | 30 |
| 2 | Academic Management Process | Quản lý lớp học, học sinh, giáo viên, lịch học, điểm danh | Critical | 50 |
| 3 | Parent Services Process | Xem thông tin con, báo cáo ngày, thực đơn, thanh toán phí, giao tiếp | Critical | 45 |
| 4 | Staff Operations Process | Chức năng y tế, dinh dưỡng, báo cáo sức khỏe | High | 25 |
| 5 | Administration Process | Quản lý trường, bài đăng, khiếu nại, thống kê | High | 35 |
| | **TOTAL** | | | **185** |

---

## 📊 CHI TIẾT TỪNG MODULE CODE

### 1️⃣ MODULE: USER & AUTHENTICATION PROCESS

**Module Code:** USER_AUTH_PROCESS  
**Priority:** ⭐⭐⭐ Critical  
**Roles involved:** All roles

#### Scope:
- Đăng ký tài khoản
- Đăng nhập/Đăng xuất
- Quản lý profile cá nhân
- Phân quyền và bảo mật
- Quản lý người dùng (Admin/School Admin)

#### Main Workflows:
1. **User Registration Flow**
   - Đăng ký tài khoản mới
   - Xác thực email/phone
   - Thiết lập mật khẩu
   - Đăng nhập lần đầu

2. **Login & Session Management**
   - Đăng nhập với các role khác nhau
   - Quản lý session/token
   - Đăng xuất
   - Remember me function

3. **Profile Management**
   - Xem thông tin cá nhân
   - Cập nhật profile
   - Upload avatar
   - Đổi mật khẩu

4. **User Administration**
   - School admin tạo user (teacher, parent, staff)
   - System admin quản lý schools và school admins
   - Soft delete/restore users
   - Role assignment và permission control

5. **Security & Authorization**
   - Role-based access control (RBAC)
   - Token expiration handling
   - Rate limiting
   - Forgot password flow

#### Key Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- GET /users/me
- PUT /users/me
- PUT /users/change-password
- GET /users (admin)
- POST /users (admin)
- PUT /users/:id (admin)
- DELETE /users/:id (admin)

#### Test Scenarios (30 test cases):
- Registration validation (5 cases)
- Login scenarios (8 cases)
- Profile management (5 cases)
- User CRUD operations (7 cases)
- Authorization & security (5 cases)

---

### 2️⃣ MODULE: ACADEMIC MANAGEMENT PROCESS

**Module Code:** ACADEMIC_MGMT_PROCESS  
**Priority:** ⭐⭐⭐ Critical  
**Roles involved:** School Admin, Teacher, Admin

#### Scope:
- Quản lý trường học
- Quản lý lớp học và khối tuổi
- Quản lý học sinh
- Quản lý giáo viên
- Lịch học và time slots
- Điểm danh và báo cáo hằng ngày
- Hoạt động trong lớp

#### Main Workflows:
1. **School Setup & Management**
   - Admin tạo trường mới
   - Cập nhật thông tin trường
   - Quản lý trạng thái trường (active/inactive)
   - School admin quản lý thông tin trường của mình

2. **Class & Class Age Management**
   - Tạo khối tuổi (Mầm, Chồi, Lá, Nhánh...)
   - Tạo lớp học và gán khối tuổi
   - Gán giáo viên chủ nhiệm
   - Promote lớp (lên lớp)
   - Quản lý học sinh trong lớp

3. **Student Management**
   - Thêm học sinh mới
   - Cập nhật thông tin học sinh
   - Gán học sinh vào lớp
   - Chuyển lớp
   - Liên kết phụ huynh với học sinh
   - Quản lý người đón
   - Quản lý trạng thái học sinh

4. **Teacher Daily Operations**
   - Teacher xem lớp của mình
   - Xem danh sách học sinh
   - Điểm danh vào (check-in)
   - Điểm danh ra (check-out)
   - Cập nhật nhận xét hằng ngày
   - Xem báo cáo tuần
   - Tạo nhóm chat lớp

5. **Calendar & Schedule Management**
   - Tạo time slots (khung giờ)
   - Tạo activities (hoạt động)
   - Thiết lập lịch học cho lớp
   - Bulk create calendar entries
   - Teacher xem lịch dạy
   - Teacher xem lịch học lớp

#### Key Endpoints:
**School:**
- GET /admin/schools
- POST /admin/schools
- PUT /admin/schools/:id
- GET /school-admin/school

**Class & ClassAge:**
- GET /classes
- POST /classes
- PUT /classes/:id
- POST /classes/:id/promote
- POST /classes/:classId/students
- GET /class-ages
- POST /class-ages

**Student:**
- GET /student/all
- POST /student
- PUT /student/:id
- POST /student/:id/transfer
- POST /student/:id/parents
- GET /student/class/:classId

**Teacher:**
- GET /teachers/class
- GET /teachers/class/students
- POST /teachers/daily-reports/checkin
- PUT /teachers/daily-reports/checkout
- PUT /teachers/daily-reports/:id/comment
- GET /teachers/students/:id/daily-reports/weekly

**Calendar:**
- GET /school-admin/calendar/class/:classId
- POST /school-admin/calendar/calendar/bulk
- POST /school-admin/calendar/slots
- POST /school-admin/calendar/activities
- GET /teachers/class-calendar

#### Test Scenarios (50 test cases):
- School management (5 cases)
- Class & class age operations (10 cases)
- Student lifecycle management (12 cases)
- Teacher daily workflow (15 cases)
- Calendar & schedule (8 cases)

---

### 3️⃣ MODULE: PARENT SERVICES PROCESS

**Module Code:** PARENT_SERVICES_PROCESS  
**Priority:** ⭐⭐⭐ Critical  
**Roles involved:** Parent, School Admin

#### Scope:
- Xem thông tin con
- Xem báo cáo hằng ngày
- Xem lịch học
- Xem thực đơn
- Quản lý phí và thanh toán
- Giao tiếp với giáo viên/nhà trường
- Quản lý người đón
- Khiếu nại/phản hồi

#### Main Workflows:
1. **Child Information Monitoring**
   - Parent xem danh sách con
   - Xem thông tin chi tiết từng con
   - Xem profile học sinh
   - Xem thông tin lớp học

2. **Daily Report Viewing**
   - Xem báo cáo hằng ngày của con
   - Xem thời gian check-in/check-out
   - Xem nhận xét của giáo viên
   - Xem ảnh hoạt động
   - Xem báo cáo theo tuần/tháng

3. **Calendar & Menu Access**
   - Xem lịch học của lớp
   - Xem time slots
   - Xem thực đơn tuần theo khối tuổi
   - Xem món ăn chi tiết (dinh dưỡng)

4. **Fee Payment Management**
   - Xem danh sách học phí
   - Xem chi tiết từng khoản phí
   - Xem invoice
   - Thanh toán online qua PayOS
   - Xem lịch sử thanh toán
   - Xem receipt/hóa đơn

5. **Communication & Interaction**
   - Xem bài đăng của nhà trường/giáo viên
   - Tạo bài đăng riêng
   - Like và comment bài đăng
   - Chat trực tiếp với giáo viên
   - Tạo conversation
   - Gửi/nhận tin nhắn realtime

6. **Pickup Person Management**
   - Thêm người đón cho con
   - Cập nhật thông tin người đón
   - Xóa người đón
   - Xem danh sách người đón

7. **Complaint & Feedback**
   - Xem loại khiếu nại
   - Tạo khiếu nại mới
   - Theo dõi trạng thái khiếu nại
   - Nhận phản hồi từ nhà trường

#### Key Endpoints:
**Child Info:**
- GET /parent/children
- GET /parent/child-info/:studentId
- GET /parent/personal-info
- PUT /parent/personal-info

**Daily Reports:**
- GET /parent/daily-reports

**Calendar & Menu:**
- GET /parent/class-calendar
- GET /parent/menu

**Fees & Payment:**
- GET /parent/fees
- POST /parent/fees/payos
- POST /parent/fees/payos/status
- POST /payos/webhook

**Communication:**
- GET /parent/posts
- POST /parent/posts
- POST /parent/posts/:postId/like
- POST /parent/posts/:postId/comments
- POST /api/messaging/conversations
- GET /api/messaging/conversations
- POST /api/messaging/messages
- GET /api/messaging/teachers-by-student/:student_id

**Pickups:**
- POST /parent/pickups/:studentId
- PUT /parent/pickups/:pickupId/:studentId
- DELETE /parent/pickups/:pickupId/:studentId

**Complaints:**
- GET /parent/complaints/types
- POST /parent/complaints
- GET /parent/complaints
- GET /parent/complaints/:complaintId

#### Test Scenarios (45 test cases):
- Child information access (5 cases)
- Daily report viewing (8 cases)
- Calendar & menu viewing (5 cases)
- Fee payment workflow (12 cases)
- Communication features (10 cases)
- Pickup management (3 cases)
- Complaint handling (2 cases)

---

### 4️⃣ MODULE: STAFF OPERATIONS PROCESS

**Module Code:** STAFF_OPS_PROCESS  
**Priority:** ⭐⭐ High  
**Roles involved:** Health Care Staff, Nutrition Staff

#### Scope:
- Quản lý sức khỏe học sinh
- Quản lý thông báo y tế
- Quản lý món ăn và dinh dưỡng
- Lập thực đơn tuần
- Quản lý profile staff

#### Main Workflows:
1. **Health Care Management**
   - Health staff xem danh sách lớp
   - Xem học sinh theo lớp
   - Tạo bản ghi sức khỏe
   - Cập nhật thông tin sức khỏe
   - Tạo thông báo y tế cho phụ huynh
   - Theo dõi lịch sử sức khỏe

2. **Nutrition Management**
   - Nutrition staff quản lý món ăn
   - Tạo món ăn mới (tên, thành phần, dinh dưỡng)
   - Cập nhật món ăn
   - Xóa món ăn
   - Xem danh sách khối tuổi
   - Xem danh sách bữa ăn (sáng, phụ sáng, trưa...)

3. **Weekly Menu Creation**
   - Xem lịch thực đơn (class age meals)
   - Gán món ăn cho bữa ăn cụ thể
   - Tạo thực đơn cả tuần
   - Xem món đã gán
   - Xem thực đơn tuần đã lập

4. **Staff Profile Management**
   - Xem profile cá nhân
   - Cập nhật thông tin
   - Đổi mật khẩu

#### Key Endpoints:
**Health Care:**
- GET /health-staff/classes
- GET /health-staff/classes/:class_id/students
- GET /health-staff/health/records
- POST /health-staff/health/records
- PUT /health-staff/health/records/:record_id
- GET /health-staff/health/notices
- POST /health-staff/health/notices
- PUT /health-staff/health/notices/:notice_id
- GET /health-staff/profile
- PUT /health-staff/profile

**Nutrition:**
- GET /nutrition/dishes
- POST /nutrition/dishes
- PUT /nutrition/dishes/:id
- DELETE /nutrition/dishes/:id
- GET /nutrition/class-ages
- GET /nutrition/meals
- GET /nutrition/weekdays
- GET /nutrition/class-age-meals
- POST /nutrition/class-age-meals/assign
- GET /nutrition/class-age-meals/dishes
- GET /nutrition/class-age-meals/weekly-dishes
- GET /nutrition/profile
- PUT /nutrition/profile

#### Test Scenarios (25 test cases):
- Health record management (8 cases)
- Health notice creation (5 cases)
- Dish management (6 cases)
- Weekly menu creation (4 cases)
- Staff profile management (2 cases)

---

### 5️⃣ MODULE: ADMINISTRATION PROCESS

**Module Code:** ADMIN_PROCESS  
**Priority:** ⭐⭐ High  
**Roles involved:** School Admin, System Admin

#### Scope:
- Quản lý bài đăng (duyệt/từ chối)
- Quản lý comments và likes
- Quản lý khiếu nại
- Quản lý loại khiếu nại
- Thống kê và báo cáo
- Quản lý thông tin trường

#### Main Workflows:
1. **Post Management & Moderation**
   - School admin xem tất cả bài đăng
   - Duyệt bài đăng pending
   - Từ chối bài đăng không phù hợp
   - Tạo bài đăng chính thức
   - Cập nhật bài đăng
   - Xóa bài đăng vi phạm

2. **Comment & Like Moderation**
   - Xem comments trên bài đăng
   - Xóa comments không phù hợp
   - Xem danh sách likes
   - Moderate user interactions

3. **Complaint Management**
   - Xem thống kê khiếu nại
   - Xem danh sách khiếu nại
   - Xem chi tiết khiếu nại
   - Duyệt/giải quyết khiếu nại
   - Từ chối khiếu nại
   - Quản lý loại khiếu nại (CRUD)

4. **School Information Management**
   - School admin xem thông tin trường
   - Cập nhật thông tin trường
   - Upload logo/images
   - Quản lý thông tin liên hệ

5. **Statistics & Reporting**
   - Xem thống kê khiếu nại
   - Xem thống kê theo status
   - Xem thống kê theo type
   - Dashboard overview

#### Key Endpoints:
**Posts:**
- GET /school-admin/posts
- GET /school-admin/posts/:postId
- POST /school-admin/posts
- PUT /school-admin/posts/:postId
- PUT /school-admin/posts/:postId/status
- DELETE /school-admin/posts/:postId
- GET /school-admin/posts/:postId/comments
- DELETE /school-admin/posts/comments/:commentId
- GET /school-admin/posts/:postId/likes

**Complaints:**
- GET /school-admin/complaints/stats
- GET /school-admin/complaints
- GET /school-admin/complaints/:complaintId
- PUT /school-admin/complaints/:complaintId/approve
- PUT /school-admin/complaints/:complaintId/reject
- GET /school-admin/complaints/types/list
- POST /school-admin/complaints/types
- PUT /school-admin/complaints/types/:typeId
- DELETE /school-admin/complaints/types/:typeId

**School:**
- GET /school-admin/school/:schoolId?
- PUT /school-admin/school/:schoolId?

#### Test Scenarios (35 test cases):
- Post moderation workflow (12 cases)
- Comment & like moderation (5 cases)
- Complaint management (10 cases)
- Complaint type management (5 cases)
- School information update (3 cases)

---

## 🎯 TEST COVERAGE MATRIX

### Test Types Distribution:

| Module | Happy Path | Negative | Edge Cases | Performance | Security | Total |
|--------|-----------|----------|------------|-------------|----------|-------|
| User & Authentication | 12 | 10 | 3 | 2 | 3 | 30 |
| Academic Management | 25 | 15 | 5 | 3 | 2 | 50 |
| Parent Services | 22 | 13 | 6 | 2 | 2 | 45 |
| Staff Operations | 15 | 6 | 2 | 1 | 1 | 25 |
| Administration | 18 | 10 | 4 | 2 | 1 | 35 |
| **TOTAL** | **92** | **54** | **20** | **10** | **9** | **185** |

---

## 📊 TEST EXECUTION SUMMARY (Template)

Sử dụng format này để copy vào Excel:

```
No | Module Code | Passed | Failed | Pending | N/A | Number of test cases
1  | User & Authentication Process | 0 | 0 | 0 | 0 | 30
2  | Academic Management Process | 0 | 0 | 0 | 0 | 50
3  | Parent Services Process | 0 | 0 | 0 | 0 | 45
4  | Staff Operations Process | 0 | 0 | 0 | 0 | 25
5  | Administration Process | 0 | 0 | 0 | 0 | 35
   | Sub total | 0 | 0 | 0 | 0 | 185
```

**Formulas for Excel:**
- Test coverage = (Passed / Number of test cases) * 100%
- Test successful coverage = (Passed / (Passed + Failed)) * 100%

---

## 🔗 CROSS-MODULE INTEGRATION SCENARIOS

### Critical End-to-End Workflows:

1. **Complete School Onboarding**
   - Admin creates school → School admin setup → Add teachers → Add students → Link parents
   - **Modules:** 1, 2

2. **Teacher Daily Operations**
   - Teacher login → Check-in students → Update reports → Post to parents → Chat with parents
   - **Modules:** 1, 2, 3

3. **Parent Complete Journey**
   - Parent login → View children → Check reports → View menu → Pay fees → Chat teacher
   - **Modules:** 1, 2, 3, 4

4. **Weekly Menu Distribution**
   - Nutrition staff creates menu → System distributes → Parents view by child age
   - **Modules:** 1, 4, 3

5. **Fee Collection Cycle**
   - School admin creates fee → System generates invoices → Parents pay → Admin verifies
   - **Modules:** 1, 2, 3, 5

6. **Complaint Resolution Flow**
   - Parent creates complaint → Admin reviews → Admin resolves → Parent receives notification
   - **Modules:** 1, 3, 5

---

## 🧪 TEST ENVIRONMENT & DATA REQUIREMENTS

### Test Accounts Required:

| Role | Username/Email | Password | School | Purpose |
|------|---------------|----------|--------|---------|
| System Admin | admin@test.com | Test@123 | N/A | Full system access |
| School Admin | schooladmin1@test.com | Test@123 | School A | School A management |
| School Admin | schooladmin2@test.com | Test@123 | School B | School B management |
| Teacher | teacher1@test.com | Test@123 | School A | Class A teacher |
| Teacher | teacher2@test.com | Test@123 | School A | Class B teacher |
| Parent | parent1@test.com | Test@123 | School A | Parent of Student 1 |
| Parent | parent2@test.com | Test@123 | School A | Parent of Student 2 |
| Health Staff | health1@test.com | Test@123 | School A | Health care |
| Nutrition Staff | nutrition1@test.com | Test@123 | School A | Menu management |

### Test Data Requirements:

**Master Data:**
- 2 Schools (School A - active, School B - inactive)
- 3 Class Ages per school
- 5 Classes per school
- 30 Students per class
- 3 Teachers per school
- 30 Parents (linked to students)
- 1 Health staff per school
- 1 Nutrition staff per school

**Transaction Data:**
- 1 week of daily reports
- 10 posts (pending + approved)
- 5 complaints (pending + resolved)
- 3 fees with invoices
- 1 week menu
- 50+ messages in conversations

---

## 📝 TESTING NOTES

### Priority Order:
1. Module 1: User & Authentication (Foundation)
2. Module 2: Academic Management (Core business)
3. Module 3: Parent Services (Critical user flow)
4. Module 5: Administration (Management)
5. Module 4: Staff Operations (Supporting)

### Critical Paths:
- Authentication flow MUST work before other modules
- Student-Parent linking MUST work before parent access
- Fee invoice generation MUST work before payment

### Known Dependencies:
- Module 3 depends on Module 1, 2
- Module 4 depends on Module 1, 2
- Module 5 depends on Module 1, 2, 3

---

## ✅ COMPLETION CRITERIA

**Module considered PASSED when:**
- ✅ All Happy Path test cases passed
- ✅ At least 90% Negative test cases passed
- ✅ All Critical bugs fixed
- ✅ Performance meets requirements (<2s response time)
- ✅ Security tests passed (auth, authorization)
- ✅ Cross-module integration scenarios passed

---

**Document Version:** 1.0  
**Last Updated:** 7/12/2025  
**Status:** Ready for Testing  
**Next Review:** After first test cycle
