# UC-HC-006: Xem danh sách học sinh / View Children List

## Tiếng Việt
- **Diễn giải:** Nhân viên y tế xem danh sách học sinh theo lớp/độ tuổi để thuận tiện cho việc ghi nhận sức khỏe và liên hệ.
- **Diễn viên chính:** Nhân viên y tế
- **Diễn viên phụ:** Hệ thống
- **Mô tả:** Xem danh sách học sinh, tìm kiếm/lọc theo lớp/độ tuổi/từ khóa, xem thông tin cơ bản.
- **Điều kiện tiên quyết:**
  - Nhân viên y tế đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Danh sách học sinh hiển thị đầy đủ, có thể lọc/tìm kiếm.
- **Luồng chính:**
  1. Nhân viên y tế truy cập mục "Học sinh".
  2. Hệ thống hiển thị danh sách học sinh.
  3. Nhân viên y tế lọc theo lớp/độ tuổi hoặc tìm kiếm theo từ khóa.
  4. Nhân viên y tế xem thông tin cơ bản từng học sinh.
- **Luồng thay thế:**
  - Không có dữ liệu hoặc lỗi tải:
    1. Hệ thống báo lỗi và yêu cầu thao tác lại.

## English
- **Use Case Name:** View Children List
- **Description:** Healthcare staff views the list of students by class/age for health recording and contact.
- **Primary Actor:** Healthcare Staff
- **Secondary Actors:** System
- **Goal:** View and filter/search student list; see basic info.
- **Preconditions:**
  - Healthcare staff is logged in.
- **Postconditions:**
  - Student list is displayed with filter/search capabilities.
- **Normal Flow:**
  1. Healthcare staff accesses the "Students" section.
  2. System displays the student list.
  3. Staff filters by class/age or searches by keyword.
  4. Staff views basic information of each student.
- **Alternative Flows:**
  - No data or loading error:
    1. System shows error and requests retry.
