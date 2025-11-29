# UC-SA-007: Quản lý tài khoản người dùng / Manage User Accounts

## Tiếng Việt
- **Diễn giải:** School Admin tạo, chỉnh sửa, khóa/mở tài khoản giáo viên, phụ huynh, học sinh.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Giáo viên, Phụ huynh, Học sinh, Hệ thống
- **Mô tả:** Quản lý tài khoản người dùng trong trường (tạo mới, chỉnh sửa, khóa/mở tài khoản).
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Tài khoản được tạo, chỉnh sửa, khóa/mở thành công.
- **Luồng chính:**
  1. School Admin truy cập chức năng quản lý tài khoản.
  2. Chọn tạo mới, chỉnh sửa hoặc khóa/mở tài khoản.
  3. Nhập thông tin cần thiết và xác nhận.
- **Luồng thay thế:**
  - Thông tin tài khoản không hợp lệ:
    1. Hệ thống báo lỗi.
    2. School Admin điều chỉnh lại thông tin.

## English
- **Description:** School Admin creates, edits, locks/unlocks teacher, parent, and student accounts.
- **Primary Actor:** School Admin
- **Secondary Actors:** Teacher, Parent, Student, System
- **Goal:** Manage user accounts in the school (create, edit, lock/unlock accounts).
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Account is created, edited, locked/unlocked successfully.
- **Normal Flow:**
  1. School Admin accesses the account management function.
  2. Selects to create, edit, or lock/unlock an account.
  3. Enters required information and confirms.
- **Alternative Flows:**
  - Invalid account information:
    1. System notifies error.
    2. School Admin adjusts the information.