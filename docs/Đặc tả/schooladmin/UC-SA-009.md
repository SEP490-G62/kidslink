# UC-SA-009: Duyệt bài đăng và quản lý bình luận / Approve Posts and Manage Comments

## Tiếng Việt
- **Diễn giải:** School Admin có thể duyệt bài đăng trước khi hiển thị, xóa bình luận không phù hợp của người khác trên bảng tin/trang chủ.
- **Diễn viên chính:** School Admin
- **Diễn viên phụ:** Giáo viên, Phụ huynh, Hệ thống
- **Mô tả:**
  - Duyệt hoặc từ chối bài đăng do giáo viên, phụ huynh gửi lên.
  - Xóa bình luận không phù hợp của bất kỳ người dùng nào.
- **Điều kiện tiên quyết:**
  - School Admin đã đăng nhập hệ thống.
- **Kết quả sau cùng:**
  - Bài đăng chỉ hiển thị sau khi được duyệt, bình luận không phù hợp bị xóa khỏi hệ thống.
- **Luồng chính:**
  1. School Admin truy cập chức năng duyệt bài đăng/bình luận.
  2. Xem danh sách bài đăng chờ duyệt và bình luận trên hệ thống.
  3. Duyệt hoặc từ chối bài đăng.
  4. Xóa bình luận không phù hợp.
  5. Hệ thống cập nhật trạng thái bài đăng và bình luận.
- **Luồng thay thế:**
  - Lỗi khi duyệt bài đăng hoặc xóa bình luận:
    1. Hệ thống báo lỗi và giữ nguyên trạng thái.

## English
- **Use Case Name:** Approve Posts and Manage Comments
- **Description:** School Admin can approve posts before they are displayed and delete inappropriate comments from others on the newsfeed/homepage.
- **Primary Actor:** School Admin
- **Secondary Actors:** Teacher, Parent, System
- **Goal:** Approve or reject posts submitted by teachers/parents; delete inappropriate comments from any user.
- **Preconditions:**
  - School Admin is logged in.
- **Postconditions:**
  - Posts are only displayed after approval; inappropriate comments are removed from the system.
- **Normal Flow:**
  1. School Admin accesses the post/comment approval function.
  2. Views the list of pending posts and all comments in the system.
  3. Approves or rejects posts.
  4. Deletes inappropriate comments.
  5. System updates the status of posts and comments.
- **Alternative Flows:**
  - Error when approving posts or deleting comments:
    1. System shows error and keeps the current state.
