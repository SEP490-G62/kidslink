
# UC-SA-003: Quản lý học phí / Manage Tuition Fees

## Tiếng Việt
- **Diễn giải:** School Admin tạo, sửa, xóa khoản phí; cấu hình áp dụng cho nhiều lớp; theo dõi, duyệt và xác nhận thanh toán học phí của từng học sinh.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Phụ huynh, Hệ thống
- **Mô tả:** Quản lý các khoản thu học phí, cấu hình phụ phí nộp muộn, theo dõi trạng thái thanh toán từng lớp, từng học sinh, xác nhận thanh toán trực tiếp hoặc online.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Khoản phí được tạo/sửa/xóa, áp dụng cho các lớp tương ứng.
  - Trạng thái thanh toán của từng học sinh được cập nhật (đã thu, chưa thu, quá hạn, có phụ phí).
- **Luồng chính:**
  1. School Admin truy cập chức năng quản lý học phí.
  2. Xem danh sách các khoản phí, lọc theo lớp, tìm kiếm, sắp xếp.
  3. Tạo mới khoản phí: nhập tên, mô tả, số tiền, chọn lớp áp dụng, cấu hình ngày đến hạn, phụ phí nộp muộn.
  4. Sửa hoặc xóa khoản phí đã tạo.
  5. Xem chi tiết khoản phí: theo dõi trạng thái thanh toán của từng lớp, từng học sinh.
  6. Duyệt hoặc xác nhận thanh toán cho từng học sinh (có thể nhập số tiền thực nhận, xác nhận thanh toán trực tiếp hoặc online).
  7. Hệ thống tự động tính phụ phí nếu quá hạn, cập nhật trạng thái thanh toán.
- **Luồng thay thế:**
  - Thông tin thiếu, số tiền không hợp lệ, lớp không tồn tại, khoản phí trùng lặp:
    1. Hệ thống báo lỗi và yêu cầu nhập lại.
    2. School Admin bổ sung/chỉnh sửa thông tin và lưu lại.
  - Thanh toán không hợp lệ (số tiền sai, học sinh không thuộc lớp, ...):
    1. Hệ thống báo lỗi.
    2. School Admin kiểm tra và xử lý lại.

## English
- **Description:** School Admin creates, edits, deletes fees; configures fees for multiple classes; tracks, approves, and confirms tuition payments for each student.
- **Primary Actor:** School Admin
- **Secondary Actors:** Parent, System
- **Goal:** Manage tuition fees, configure late fees, track payment status for each class and student, confirm direct or online payments.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Fee is created/edited/deleted and applied to selected classes.
  - Payment status for each student is updated (paid, unpaid, overdue, with late fee).
- **Normal Flow:**
  1. School Admin accesses the tuition fee management function.
  2. Views the list of fees, filters by class, searches, sorts.
  3. Creates a new fee: enters name, description, amount, selects classes, configures due date and late fee.
  4. Edits or deletes an existing fee.
  5. Views fee details: tracks payment status for each class and student.
  6. Approves or confirms payment for each student (can enter received amount, confirm direct or online payment).
  7. System automatically calculates late fee if overdue, updates payment status.
- **Alternative Flows:**
  - Missing information, invalid amount, class not found, duplicate fee:
    1. System notifies error and requests input again.
    2. School Admin provides/corrects information and saves.
  - Invalid payment (wrong amount, student not in class, ...):
    1. System notifies error.
    2. School Admin checks and handles again.

## English
- **Description:** School Admin configures tuition fees, approves or rejects tuition payments.
- **Primary Actor:** School Admin
- **Secondary Actors:** Parent, System
- **Goal:** Manage tuition fees, approve/reject payments.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Tuition fee is configured, payment is approved or rejected.
- **Normal Flow:**
  1. School Admin accesses the tuition fee management function.
  2. Creates or edits tuition fee items.
  3. Approves or rejects parents' payment transactions.
- **Alternative Flows:**
  - Invalid payment:
    1. System notifies error.
    2. School Admin checks and handles again.