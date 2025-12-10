# UC-HC-011: Cập nhật hồ sơ cá nhân / Update Profile (Healthcare)

## Tiếng Việt
- **Diễn giải:** Nhân viên y tế cập nhật thông tin hồ sơ cá nhân như họ tên, ảnh đại diện, số điện thoại, email, địa chỉ, ...
- **Diễn viên chính:** Nhân viên y tế
- **Mô tả:** Truy cập chức năng cập nhật hồ sơ → chỉnh sửa trường thông tin → lưu thay đổi.
- **Điều kiện tiên quyết:** Đã đăng nhập hệ thống.
- **Kết quả sau cùng:** Thông tin hồ sơ cá nhân được cập nhật thành công.
- **Luồng chính:**
  1. Truy cập chức năng cập nhật hồ sơ.
  2. Hệ thống hiển thị thông tin cá nhân hiện tại.
  3. Chỉnh sửa các trường thông tin cần thiết.
  4. Lưu thay đổi.
  5. Hệ thống xác nhận cập nhật thành công.
- **Luồng thay thế:**
  - Thiếu/không hợp lệ thông tin: hệ thống báo lỗi, yêu cầu nhập lại.
  - Lỗi lưu dữ liệu: hệ thống báo lỗi và giữ nguyên trạng thái.

## English
- **Use Case Name:** Update Profile (Healthcare)
- **Description:** Healthcare staff updates personal profile information such as name, avatar, phone number, email, address, etc.
- **Primary Actor:** Healthcare Staff
- **Details:** Access update profile → edit fields → save changes.
- **Preconditions:** Logged in.
- **Postconditions:** Personal profile information is updated successfully.
- **Normal Flow:** Access update profile → system shows current info → edit → save → system confirms.
- **Alternative Flows:** Missing/invalid info or save error: system shows error.
