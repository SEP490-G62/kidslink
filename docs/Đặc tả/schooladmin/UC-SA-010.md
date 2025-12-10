# UC-SA-010: Quản lý đơn khiếu nại / Manage Complaints

## 1. Mô tả/Tóm tắt
School Admin có thể xem, lọc, xử lý các đơn khiếu nại do giáo viên và phụ huynh gửi lên. Admin có thể duyệt, từ chối đơn, phản hồi cho người gửi.

## 2. Tác nhân (Actor)
- School Admin

## 3. Tiền điều kiện (Preconditions)
- School Admin đã đăng nhập hệ thống.
- Hệ thống đã có các đơn khiếu nại được gửi bởi giáo viên hoặc phụ huynh.

## 4. Kết quả (Postconditions)
- Đơn khiếu nại được cập nhật trạng thái (đã duyệt, từ chối).
- Người gửi nhận được phản hồi từ admin.
- Danh sách loại đơn khiếu nại được cập nhật khi admin thao tác.

## 5. Luồng chính (Main Flow)
1. School Admin truy cập trang "Quản lý đơn khiếu nại".
2. Hệ thống hiển thị danh sách đơn khiếu nại, cho phép lọc theo loại người gửi (giáo viên, phụ huynh) và trạng thái (tất cả, đang chờ, đã duyệt, từ chối).
3. Admin chọn một đơn để xem chi tiết.
4. Hệ thống hiển thị chi tiết đơn, bao gồm: loại đơn, người gửi, nội dung, hình ảnh đính kèm (nếu có), trạng thái, phản hồi (nếu có).
5. Nếu đơn ở trạng thái "đang chờ", admin có thể nhập phản hồi và chọn "Duyệt đơn" hoặc "Từ chối".
6. Hệ thống cập nhật trạng thái đơn, lưu phản hồi và thông báo kết quả cho admin.
7. (Bỏ, chuyển sang use case riêng về quản lý loại đơn khiếu nại)

## 6. Luồng phụ (Alternative Flows)
- Nếu admin không nhập tên loại đơn hoặc không chọn loại người dùng khi tạo/sửa loại đơn, hệ thống báo lỗi.
- Nếu thao tác xóa loại đơn, hệ thống xác nhận trước khi thực hiện.
- Nếu thao tác xử lý đơn thất bại, hệ thống báo lỗi.

## 7. Yêu cầu phi chức năng (Non-functional Requirements)
- Giao diện trực quan, dễ sử dụng.
- Phản hồi thao tác nhanh, thông báo rõ ràng.
- Bảo mật thông tin đơn khiếu nại và người gửi.

## 8. Liên kết màn hình/UI
- Trang: Quản lý đơn khiếu nại (ManageComplaints.js)
- Dialog: Quản lý loại đơn khiếu nại

## 9. Đặc tả nghiệp vụ chi tiết
- Xem, lọc, tìm kiếm đơn khiếu nại.
- Xem chi tiết đơn, hình ảnh đính kèm.
- Duyệt hoặc từ chối đơn, nhập phản hồi.
  

## 10. Phụ lục
- Trạng thái đơn: đang chờ, đã duyệt, từ chối.
- Loại người gửi: giáo viên, phụ huynh.
- Loại đơn: do admin cấu hình.