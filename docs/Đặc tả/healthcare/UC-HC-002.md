# UC-HC-002: Quản lý thực đơn (tạo, sửa, xóa thực đơn)

## Tiếng Việt
- **Diễn giải:** Nhân viên y tế có thể tạo mới, chỉnh sửa hoặc xóa thực đơn cho trường.
- **Diễn viên chính:** Nhân viên y tế
- **Diễn viên phụ:** Hệ thống
- **Mô tả:**
  - Tạo mới thực đơn cho ngày/tuần/tháng.
  - Chỉnh sửa thông tin thực đơn (món ăn, thành phần, dinh dưỡng).
  - Xóa thực đơn không còn sử dụng.
- **Điều kiện tiên quyết:**
  - Nhân viên y tế đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Thực đơn được cập nhật đúng theo thao tác.
- **Luồng chính:**
  1. Nhân viên y tế truy cập mục "Quản lý thực đơn".
  2. Hệ thống hiển thị danh sách thực đơn hiện có.
  3. Nhân viên y tế chọn tạo mới, chỉnh sửa hoặc xóa thực đơn.
  4. Hệ thống cập nhật và hiển thị thay đổi.
- **Luồng thay thế:**
  - Lỗi khi tạo/sửa/xóa: Hệ thống báo lỗi và giữ nguyên trạng thái.

## English
- **Description:** Health care staff can create, edit, or delete menus for the school.
- **Primary Actor:** Health care staff
- **Secondary Actor:** System
- **Details:**
  - Create new menu for day/week/month.
  - Edit menu information (dishes, ingredients, nutrition).
  - Delete unused menu.
- **Preconditions:**
  - Health care staff is logged in.
- **Postconditions:**
  - Menu is updated according to the operation.
- **Normal Flow:**
  1. Health care staff accesses the "Menu Management" section.
  2. System displays the list of existing menus.
  3. Health care staff chooses to create, edit, or delete a menu.
  4. System updates and displays the changes.
- **Alternative Flows:**
  - Error when creating/editing/deleting: System shows error and keeps the current state.
