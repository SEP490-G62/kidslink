# UC-SA-002: Quản lý lớp học / Manage Classes

## Tiếng Việt
- **Diễn giải:** School Admin tạo lớp, phân công giáo viên, chuyển học sinh giữa các lớp.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Giáo viên, Hệ thống
- **Mô tả:** Quản lý lớp học, phân công giáo viên, chuyển lớp cho học sinh.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Lớp học được tạo mới, giáo viên được phân công, học sinh được chuyển lớp thành công.
- **Luồng chính:**
  1. School Admin truy cập chức năng quản lý lớp học.
  2. Chọn tạo mới lớp, phân công giáo viên, hoặc chuyển học sinh giữa các lớp.
  3. Nhập thông tin cần thiết và xác nhận.
- **Luồng thay thế:**
  - Giáo viên đã được phân công cho lớp khác:
    1. Hệ thống báo lỗi.
    2. School Admin chọn giáo viên khác hoặc điều chỉnh lại.

## English
- **Description:** School Admin creates classes, assigns teachers, and transfers students between classes.
- **Primary Actor:** School Admin
- **Secondary Actors:** Teacher, System
- **Goal:** Manage classes, assign teachers, transfer students.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Class is created, teacher assigned, student transferred successfully.
- **Normal Flow:**
  1. School Admin accesses the class management function.
  2. Selects to create a new class, assign a teacher, or transfer students.
  3. Enters required information and confirms.
- **Alternative Flows:**
  - Teacher already assigned to another class:
    1. System notifies error.
    2. School Admin selects another teacher or adjusts assignment.