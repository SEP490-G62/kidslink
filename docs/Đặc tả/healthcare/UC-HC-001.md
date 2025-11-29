# UC-HC-001: Xem bảng thực đơn chung

## Tiếng Việt
- **Diễn giải:** Nhân viên y tế có thể xem bảng thực đơn chung của trường để nắm được các bữa ăn trong tuần/tháng.
- **Diễn viên chính:** Nhân viên y tế
- **Diễn viên phụ:** Hệ thống
- **Mô tả:**
  - Xem danh sách các thực đơn theo ngày/tuần/tháng.
  - Xem chi tiết từng bữa ăn trong thực đơn (món ăn, thành phần, dinh dưỡng).
- **Điều kiện tiên quyết:**
  - Nhân viên y tế đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Thực đơn được hiển thị đầy đủ, chính xác.
- **Luồng chính:**
  1. Nhân viên y tế truy cập mục "Bảng thực đơn chung".
  2. Hệ thống hiển thị danh sách thực đơn theo ngày/tuần/tháng.
  3. Nhân viên y tế chọn thực đơn để xem chi tiết.
  4. Hệ thống hiển thị chi tiết các bữa ăn trong thực đơn.
- **Luồng thay thế:**
  - Không có thực đơn: Hệ thống hiển thị thông báo "Không có thực đơn".
  - Lỗi tải dữ liệu: Hệ thống báo lỗi và giữ nguyên trạng thái.

## English
- **Description:** Health care staff can view the school's general menu to see meals for the week/month.
- **Primary Actor:** Health care staff
- **Secondary Actor:** System
- **Details:**
  - View list of menus by day/week/month.
  - View details of each meal in the menu (dishes, ingredients, nutrition).
- **Preconditions:**
  - Health care staff is logged in.
- **Postconditions:**
  - Menu is displayed completely and accurately.
- **Normal Flow:**
  1. Health care staff accesses the "General Menu" section.
  2. System displays the list of menus by day/week/month.
  3. Health care staff selects a menu to view details.
  4. System displays details of the meals in the menu.
- **Alternative Flows:**
  - No menu: System shows message "No menu available".
  - Data loading error: System shows error and keeps the current state.
