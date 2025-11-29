# UC-SA-008: Quản lý thông tin trường học / Manage School Information

## Tiếng Việt
- **Diễn giải:** School Admin xem, cập nhật thông tin trường học, cấu hình các thông tin liên hệ, tài khoản ngân hàng, logo, v.v.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Hệ thống
- **Mô tả:** Quản lý thông tin cơ bản của trường, cập nhật liên hệ, tài khoản, logo, cấu hình hệ thống.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Thông tin trường học được cập nhật chính xác.
- **Luồng chính:**
  1. School Admin truy cập chức năng "Thông tin trường học".
  2. Xem thông tin hiện tại của trường.
  3. Chỉnh sửa, cập nhật các thông tin cần thiết (tên, địa chỉ, liên hệ, tài khoản ngân hàng, logo, ...).
  4. Hệ thống xác nhận và lưu thay đổi.
- **Luồng thay thế:**
  - Thông tin không hợp lệ hoặc cập nhật thất bại:
    1. Hệ thống báo lỗi và yêu cầu nhập lại.

## English
- **Description:** School Admin views and updates school information, configures contact info, bank account, logo, etc.
- **Primary Actor:** School Admin
- **Secondary Actors:** System
- **Goal:** Manage basic school information, update contact, account, logo, and system configuration.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - School information is updated accurately.
- **Normal Flow:**
  1. School Admin accesses the "School Information" function.
  2. Views current school information.
  3. Edits and updates necessary information (name, address, contact, bank account, logo, ...).
  4. System confirms and saves changes.
- **Alternative Flows:**
  - Invalid information or update failed:
    1. System notifies error and requests input again.