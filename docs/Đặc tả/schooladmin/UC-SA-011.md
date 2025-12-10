
# UC-SA-011: Quản lý loại đơn khiếu nại / Manage Complaint Types

## Tiếng Việt
- **Diễn giải:** School Admin có thể tạo mới, chỉnh sửa, xóa và lọc các loại đơn khiếu nại áp dụng cho giáo viên hoặc phụ huynh. Việc cấu hình loại đơn giúp hệ thống linh hoạt với các nhu cầu khiếu nại khác nhau.
- **Diễn viên chính:** School Admin
- **Mô tả:** Quản lý các loại đơn khiếu nại (tạo, sửa, xóa, lọc theo loại người dùng: giáo viên, phụ huynh).
- **Điều kiện tiên quyết:**
	- School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
	- Danh sách loại đơn khiếu nại được cập nhật (tạo mới, chỉnh sửa, xóa).
	- Các loại đơn mới có thể được chọn khi tạo đơn khiếu nại.
- **Luồng chính:**
	1. School Admin truy cập dialog "Quản lý loại đơn khiếu nại" từ trang quản lý đơn khiếu nại.
	2. Hệ thống hiển thị danh sách loại đơn hiện có, cho phép lọc theo loại người dùng (giáo viên, phụ huynh, tất cả).
	3. Admin chọn tạo mới, nhập tên loại đơn, mô tả, chọn loại người dùng áp dụng và lưu.
	4. Admin có thể chọn một loại đơn để chỉnh sửa thông tin hoặc xóa.
	5. Hệ thống xác nhận khi xóa loại đơn.
	6. Hệ thống cập nhật danh sách loại đơn khiếu nại tương ứng.
- **Luồng thay thế:**
	- Nếu admin không nhập tên loại đơn hoặc không chọn loại người dùng, hệ thống báo lỗi.
	- Nếu thao tác xóa loại đơn, hệ thống xác nhận trước khi thực hiện.
	- Nếu thao tác tạo/sửa/xóa thất bại, hệ thống báo lỗi.

## English
- **Use Case Name:** Manage Complaint Types
- **Description:** School Admin can create, edit, delete, and filter complaint types for teachers or parents. This configuration allows the system to flexibly adapt to different complaint needs.
- **Primary Actor:** School Admin
- **Goal:** Manage complaint types (create, edit, delete, filter by user type: teacher, parent).
- **Preconditions:**
	- School Admin is logged in.
- **Postconditions:**
	- Complaint type list is updated (created, edited, deleted).
	- New complaint types can be selected when creating a complaint.
- **Normal Flow:**
	1. School Admin accesses the "Manage Complaint Types" dialog from the complaint management page.
	2. System displays the list of existing complaint types, allowing filtering by user type (teacher, parent, all).
	3. Admin selects to create a new type, enters name, description, selects user type(s), and saves.
	4. Admin can select a type to edit or delete.
	5. System confirms when deleting a type.
	6. System updates the complaint type list accordingly.
- **Alternative Flows:**
	- If admin does not enter a name or select user type, the system shows an error.
	- If deleting a type, the system asks for confirmation.
	- If create/edit/delete fails, the system shows an error.