# UC-SA-012: Quản lý slot học / Manage Class Slots

## Tiếng Việt
- **Diễn giải:** School Admin có thể tạo mới, chỉnh sửa, xóa các slot học (ca học, tiết học) dùng để xây dựng thời khóa biểu cho các lớp.
- **Diễn viên chính:** School Admin
- **Mô tả:** Quản lý danh sách slot học (ca học/tiết học), bao gồm thông tin về thời gian bắt đầu, kết thúc, tên slot, thứ tự slot.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Slot học được tạo, sửa, hoặc xóa thành công.
  - Danh sách slot học được cập nhật và sử dụng khi tạo/thay đổi thời khóa biểu.
- **Luồng chính:**
  1. School Admin truy cập chức năng quản lý slot học.
  2. Hệ thống hiển thị danh sách slot học hiện có.
  3. Admin chọn tạo mới, nhập thông tin slot (tên, thời gian bắt đầu/kết thúc, thứ tự).
  4. Admin có thể chọn slot để chỉnh sửa hoặc xóa.
  5. Hệ thống xác nhận khi xóa slot học.
  6. Hệ thống cập nhật danh sách slot học tương ứng.
- **Luồng thay thế:**
  - Nếu thiếu thông tin hoặc trùng thời gian/thứ tự, hệ thống báo lỗi.
  - Nếu thao tác xóa slot, hệ thống xác nhận trước khi thực hiện.
  - Nếu thao tác tạo/sửa/xóa thất bại, hệ thống báo lỗi.

## English
- **Use Case Name:** Manage Class Slots
- **Description:** School Admin can create, edit, delete class slots (periods/lessons) used for building class timetables.
- **Primary Actor:** School Admin
- **Goal:** Manage the list of class slots (periods/lessons), including start/end time, slot name, slot order.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Class slot is created, edited, or deleted successfully.
  - The slot list is updated and used when creating/editing timetables.
- **Normal Flow:**
  1. School Admin accesses the class slot management function.
  2. System displays the current list of class slots.
  3. Admin selects to create a new slot, enters slot information (name, start/end time, order).
  4. Admin can select a slot to edit or delete.
  5. System confirms when deleting a slot.
  6. System updates the slot list accordingly.
- **Alternative Flows:**
  - If information is missing or time/order is duplicated, the system shows an error.
  - If deleting a slot, the system asks for confirmation.
  - If create/edit/delete fails, the system shows an error.
