# UC-SA-001: Quản lý lịch học / Manage Class Schedules

## Tiếng Việt
- **Diễn giải:** School Admin tạo, sửa, xóa lịch học cho từng lớp trong trường.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Giáo viên, Hệ thống
- **Mô tả:** Quản lý lịch học (thời khóa biểu) cho các lớp, bao gồm các tiết học, hoạt động, giáo viên phụ trách.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Lịch học được tạo, sửa, hoặc xóa thành công cho lớp tương ứng.
- **Luồng chính:**
  1. School Admin truy cập chức năng quản lý lịch học của lớp.
  2. Chọn lớp cần thao tác.
  3. Chọn tạo mới, chỉnh sửa hoặc xóa lịch học (tiết học, hoạt động, giáo viên).
  4. Nhập thông tin chi tiết (ngày, tiết, hoạt động, giáo viên phụ trách...).
  5. Xác nhận và lưu thay đổi.
- **Luồng thay thế:**
  - Thiếu thông tin hoặc lớp không tồn tại:
    1. Hệ thống báo lỗi và yêu cầu nhập lại.
    2. School Admin bổ sung thông tin hoặc chọn lại lớp và lưu lại.

## English
- **Description:** School Admin creates, edits, or deletes class schedules for each class in the school.
- **Primary Actor:** School Admin
- **Secondary Actors:** Teacher, System
- **Goal:** Manage class schedules (timetables) for classes, including lessons, activities, and assigned teachers.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Class schedule is created, edited, or deleted successfully for the selected class.
- **Normal Flow:**
  1. School Admin accesses the class schedule management function.
  2. Selects the class to manage.
  3. Selects to create, edit, or delete a schedule entry (lesson, activity, teacher).
  4. Enters detailed information (date, period, activity, assigned teacher, etc.).
  5. Confirms and saves changes.
- **Alternative Flows:**
  - Missing information or class does not exist:
    1. System notifies error and requests input again.
    2. School Admin provides additional information or selects another class and saves.