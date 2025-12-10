# UC-HC-007: Xem hồ sơ sức khỏe / View Health Records

## Tiếng Việt
- **Diễn giải:** Nhân viên y tế xem hồ sơ sức khỏe của học sinh (chỉ số, triệu chứng, lịch sử khám/tiêm, ghi chú).
- **Diễn viên chính:** Nhân viên y tế
- **Diễn viên phụ:** Hệ thống
- **Mô tả:** Xem chi tiết hồ sơ theo học sinh, theo ngày; lọc theo loại bản ghi.
- **Điều kiện tiên quyết:** Đã đăng nhập.
- **Kết quả sau cùng:** Hồ sơ sức khỏe hiển thị đầy đủ theo tiêu chí chọn.
- **Luồng chính:**
  1. Truy cập mục "Hồ sơ sức khỏe".
  2. Chọn học sinh cần xem.
  3. Lọc theo thời gian/loại bản ghi (chỉ số, khám, tiêm).
  4. Xem chi tiết từng bản ghi.
- **Luồng thay thế:** Lỗi tải dữ liệu: hệ thống báo lỗi.

## English
- **Use Case Name:** View Health Records
- **Description:** Healthcare staff views student health records (indicators, symptoms, check/vaccination history, notes).
- **Primary Actor:** Healthcare Staff
- **Secondary Actors:** System
- **Preconditions:** Logged in.
- **Postconditions:** Health records are displayed according to selection.
- **Normal Flow:** Access health records → select student → filter by time/type → view details.
- **Alternative Flows:** Data loading error: system shows error.
