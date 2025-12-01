# KidsLink Unit Test Functions Summary

**Project:** KidsLink
**Project Code:** KIDSLINK
**Version:** 1.0.0

## Tổng quan

- **Total Modules:** 20
- **Total Methods:** 110

## Danh sách Modules và Methods

### 1. Authentication (authController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | signToken | Tạo JWT token cho user |
| 2 | register | Đăng ký tài khoản mới |
| 3 | login | Đăng nhập hệ thống |
| 4 | logout | Đăng xuất |
| 5 | refreshToken | Làm mới token |

### 2. User Management (userController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllUsers | Lấy danh sách tất cả users |
| 2 | getUserById | Lấy thông tin user theo ID |
| 3 | updateUser | Cập nhật thông tin user |
| 4 | deleteUser | Xóa user |

### 3. Student Management (studentController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | sanitizeUsername | Làm sạch username |
| 2 | generateRandomPassword | Tạo mật khẩu ngẫu nhiên |
| 3 | generateUniqueParentUsername | Tạo username duy nhất cho parent |
| 4 | createStudent | Tạo học sinh mới |
| 5 | getAllStudents | Lấy danh sách học sinh |
| 6 | getStudentById | Lấy thông tin học sinh theo ID |
| 7 | updateStudent | Cập nhật thông tin học sinh |
| 8 | deleteStudent | Xóa học sinh |

### 4. Class Management (classController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getSchoolIdForAdmin | Lấy school_id từ school_admin |
| 2 | listClasses | Lấy danh sách lớp học |
| 3 | getLatestAcademicYearForSchool | Lấy năm học mới nhất của trường |
| 4 | getClassById | Lấy thông tin lớp theo ID |
| 5 | createClass | Tạo lớp học mới |
| 6 | updateClass | Cập nhật thông tin lớp |
| 7 | deleteClass | Xóa lớp học |

### 5. Class Age Management (classAgeController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllClassAges | Lấy danh sách độ tuổi lớp |
| 2 | getClassAgeById | Lấy thông tin độ tuổi lớp theo ID |
| 3 | createClassAge | Tạo độ tuổi lớp mới |
| 4 | updateClassAge | Cập nhật độ tuổi lớp |
| 5 | deleteClassAge | Xóa độ tuổi lớp |

### 6. Parent Management (parentController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllPosts | Lấy tất cả bài đăng |
| 2 | createPost | Tạo bài đăng mới |
| 3 | updatePost | Cập nhật bài đăng |
| 4 | deletePost | Xóa bài đăng |
| 5 | getChildren | Lấy danh sách con |
| 6 | toggleLike | Bật/tắt like |
| 7 | getLikes | Lấy danh sách likes |
| 8 | createComment | Tạo comment |
| 9 | getComments | Lấy danh sách comments |
| 10 | updateComment | Cập nhật comment |
| 11 | deleteComment | Xóa comment |
| 12 | getPersonalInfo | Lấy thông tin cá nhân |
| 13 | updatePersonalInfo | Cập nhật thông tin cá nhân |
| 14 | getChildInfo | Lấy thông tin con |
| 15 | getClassCalendarLatest | Lấy lịch lớp mới nhất |
| 16 | getStudentFees | Lấy phí học sinh |
| 17 | createPayOSPaymentRequest | Tạo yêu cầu thanh toán PayOS |
| 18 | checkPayOSPaymentStatus | Kiểm tra trạng thái thanh toán PayOS |

### 7. Teacher Management (teacherController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllTeachers | Lấy danh sách giáo viên |
| 2 | getTeacherById | Lấy thông tin giáo viên theo ID |
| 3 | createTeacher | Tạo giáo viên mới |
| 4 | updateTeacher | Cập nhật thông tin giáo viên |
| 5 | deleteTeacher | Xóa giáo viên |

### 8. Fee Management (feeController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllFees | Lấy danh sách phí |
| 2 | getFeeById | Lấy thông tin phí theo ID |
| 3 | createFee | Tạo phí mới |
| 4 | updateFee | Cập nhật phí |
| 5 | deleteFee | Xóa phí |

### 9. Daily Report (dailyReportController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | createDailyReport | Tạo báo cáo hàng ngày |
| 2 | getDailyReports | Lấy danh sách báo cáo hàng ngày |
| 3 | getDailyReportById | Lấy báo cáo hàng ngày theo ID |
| 4 | updateDailyReport | Cập nhật báo cáo hàng ngày |
| 5 | deleteDailyReport | Xóa báo cáo hàng ngày |

### 10. Health Care (healthCareController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | createHealthRecord | Tạo hồ sơ sức khỏe |
| 2 | getHealthRecords | Lấy danh sách hồ sơ sức khỏe |
| 3 | getHealthRecordById | Lấy hồ sơ sức khỏe theo ID |
| 4 | updateHealthRecord | Cập nhật hồ sơ sức khỏe |
| 5 | createHealthNotice | Tạo thông báo sức khỏe |
| 6 | getHealthNotices | Lấy danh sách thông báo sức khỏe |

### 11. Nutrition (nutritionController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getMenu | Lấy thực đơn |
| 2 | createMenu | Tạo thực đơn mới |
| 3 | updateMenu | Cập nhật thực đơn |
| 4 | getDishes | Lấy danh sách món ăn |
| 5 | createDish | Tạo món ăn mới |

### 12. School Admin - Posts (schoolAdminPostController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllPosts | Lấy tất cả bài đăng (school admin) |
| 2 | createPost | Tạo bài đăng mới (school admin) |
| 3 | updatePost | Cập nhật bài đăng (school admin) |
| 4 | deletePost | Xóa bài đăng (school admin) |

### 13. School Admin - Comments (schoolAdminCommentController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getComments | Lấy comments (school admin) |
| 2 | createComment | Tạo comment (school admin) |
| 3 | updateComment | Cập nhật comment (school admin) |
| 4 | deleteComment | Xóa comment (school admin) |

### 14. School Admin - Complaints (schoolAdminComplaintController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllComplaints | Lấy danh sách khiếu nại |
| 2 | getComplaintById | Lấy khiếu nại theo ID |
| 3 | updateComplaintStatus | Cập nhật trạng thái khiếu nại |
| 4 | createComplaintResponse | Tạo phản hồi khiếu nại |

### 15. School Admin - Calendar (schoolAdminCalendarController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | createCalendar | Tạo lịch |
| 2 | getCalendars | Lấy danh sách lịch |
| 3 | getCalendarById | Lấy lịch theo ID |
| 4 | updateCalendar | Cập nhật lịch |
| 5 | deleteCalendar | Xóa lịch |

### 16. School Admin - School (schoolAdminSchoolController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getSchoolInfo | Lấy thông tin trường |
| 2 | updateSchoolInfo | Cập nhật thông tin trường |

### 17. Admin School (adminSchoolController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllSchools | Lấy danh sách tất cả trường |
| 2 | getSchoolById | Lấy thông tin trường theo ID |
| 3 | createSchool | Tạo trường mới |
| 4 | updateSchool | Cập nhật thông tin trường |
| 5 | deleteSchool | Xóa trường |

### 18. PayOS Payment (payosController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | createPaymentLink | Tạo link thanh toán PayOS |
| 2 | getPaymentInfo | Lấy thông tin thanh toán |
| 3 | cancelPayment | Hủy thanh toán |
| 4 | confirmWebhook | Xác nhận webhook từ PayOS |

### 19. Slot Management (slotController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | getAllSlots | Lấy danh sách slot |
| 2 | getSlotById | Lấy thông tin slot theo ID |
| 3 | createSlot | Tạo slot mới |
| 4 | updateSlot | Cập nhật slot |
| 5 | deleteSlot | Xóa slot |

### 20. Messaging (messagingController)

| # | Method Name | Description |
|---|-------------|-------------|
| 1 | createConversation | Tạo cuộc trò chuyện |
| 2 | getConversations | Lấy danh sách cuộc trò chuyện |
| 3 | sendMessage | Gửi tin nhắn |
| 4 | getMessages | Lấy danh sách tin nhắn |

