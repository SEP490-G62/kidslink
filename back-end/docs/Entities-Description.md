# Entities Description

## Mô tả các Entities và Quan hệ trong hệ thống KidsLink

| # | Entity | Description |
|---|--------|-------------|
| 1 | **User** | Entity cốt lõi quản lý thông tin người dùng trong hệ thống. Có quan hệ **belongsTo** với School (school_id). Được kế thừa bởi các role-specific entities: Parent (1-1), Teacher (1-1), HealthCareStaff (1-1). Có quan hệ **hasMany** với Post, Message, PostLike, PostComment, Complaint. |
| 2 | **School** | Entity quản lý thông tin trường học. Có quan hệ **hasMany** với User, Student, Class, ClassAge, Activity, Dish, Fee, Slot, ComplaintType. Chứa cấu hình PayOS để xử lý thanh toán. |
| 3 | **ClassAge** | Entity quản lý nhóm tuổi học sinh (ví dụ: 3 tuổi, 4 tuổi). Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với Class, ClassAgeMeal. |
| 4 | **Class** | Entity quản lý lớp học cụ thể trong một năm học. Có quan hệ **belongsTo** với School (school_id), ClassAge (class_age_id), Teacher (teacher_id, teacher_id2). Có quan hệ **hasMany** với Calendar, StudentClass, Post, Conversation, ClassFee. |
| 5 | **Student** | Entity quản lý thông tin học sinh. Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với ParentStudent (many-to-many với Parent), StudentClass (many-to-many với Class), DailyReport, HealthRecord, HealthNotice, PickupStudent (many-to-many với Pickup). |
| 6 | **Parent** | Entity mở rộng từ User, quản lý thông tin phụ huynh. Có quan hệ **belongsTo** với User (user_id, unique). Có quan hệ **hasMany** với ParentStudent (many-to-many với Student). |
| 7 | **Teacher** | Entity mở rộng từ User, quản lý thông tin giáo viên. Có quan hệ **belongsTo** với User (user_id, unique). Có quan hệ **hasMany** với Class (teacher_id, teacher_id2), Calendar, DailyReport (teacher_checkin_id, teacher_checkout_id). |
| 8 | **HealthCareStaff** | Entity mở rộng từ User, quản lý thông tin nhân viên y tế. Có quan hệ **belongsTo** với User (user_id, unique). Có quan hệ **hasMany** với HealthRecord, HealthNotice. |
| 9 | **Activity** | Entity quản lý các hoạt động học tập. Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với Calendar. |
| 10 | **Calendar** | Entity quản lý lịch học hàng ngày của lớp. Có quan hệ **belongsTo** với Class (class_id), WeekDay (weekday_id), Slot (slot_id), Activity (activity_id), Teacher (teacher_id). Kết hợp các thông tin: lớp học, ngày trong tuần, khung giờ, hoạt động và giáo viên phụ trách. |
| 11 | **Slot** | Entity quản lý khung giờ học trong ngày (ví dụ: 8:00-9:00). Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với Calendar. |
| 12 | **WeekDay** | Entity quản lý các ngày trong tuần (Thứ 2, Thứ 3, ...). Có quan hệ **hasMany** với Calendar, ClassAgeMeal. |
| 13 | **Meal** | Entity quản lý các bữa ăn (Sáng, Trưa, Chiều). Có quan hệ **hasMany** với Dish, ClassAgeMeal. |
| 14 | **Dish** | Entity quản lý các món ăn. Có quan hệ **belongsTo** với School (school_id), Meal (meal_type). Có quan hệ **hasMany** với DishesClassAgeMeal (many-to-many với ClassAgeMeal). |
| 15 | **ClassAgeMeal** | Entity quản lý thực đơn theo nhóm tuổi và ngày. Có quan hệ **belongsTo** với ClassAge (class_age_id), Meal (meal_id), WeekDay (weekday_id). Có quan hệ **hasMany** với DishesClassAgeMeal (many-to-many với Dish). |
| 16 | **DishesClassAgeMeal** | Junction table kết nối ClassAgeMeal và Dish (many-to-many). Có quan hệ **belongsTo** với ClassAgeMeal (class_age_meal_id), Dish (dish_id). Đảm bảo mỗi món ăn chỉ xuất hiện một lần trong một thực đơn. |
| 17 | **Fee** | Entity quản lý các loại phí của trường. Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với ClassFee. Chứa thông tin về phí trễ hạn (late_fee_type, late_fee_value). |
| 18 | **ClassFee** | Entity quản lý việc áp dụng phí cho lớp học. Có quan hệ **belongsTo** với Class (class_id), Fee (fee_id). Có quan hệ **hasMany** với Invoice. |
| 19 | **Invoice** | Entity quản lý hóa đơn thanh toán của học sinh. Có quan hệ **belongsTo** với ClassFee (class_fee_id), StudentClass (student_class_id), Payment (payment_id, optional). Chứa thông tin PayOS (payos_order_code, payos_checkout_url, payos_qr_code) và phí trễ hạn (late_fee_amount). |
| 20 | **Payment** | Entity quản lý giao dịch thanh toán. Có quan hệ **hasMany** với Invoice. Lưu trữ thông tin phương thức thanh toán (offline/online) và tổng số tiền. |
| 21 | **Post** | Entity quản lý bài đăng trên hệ thống. Có quan hệ **belongsTo** với User (user_id), Class (class_id, optional). Có quan hệ **hasMany** với PostImage, PostComment, PostLike. |
| 22 | **PostImage** | Entity quản lý hình ảnh đính kèm bài đăng. Có quan hệ **belongsTo** với Post (post_id). |
| 23 | **PostComment** | Entity quản lý bình luận trên bài đăng. Có quan hệ **belongsTo** với Post (post_id), User (user_id), PostComment (parent_comment_id, optional - hỗ trợ comment lồng nhau). |
| 24 | **PostLike** | Junction table quản lý lượt thích bài đăng (many-to-many giữa Post và User). Có quan hệ **belongsTo** với Post (post_id), User (user_id). Đảm bảo mỗi user chỉ like một lần mỗi post. |
| 25 | **Conversation** | Entity quản lý cuộc trò chuyện (nhóm chat lớp hoặc chat riêng). Có quan hệ **belongsTo** với Class (class_id). Có quan hệ **hasMany** với Message, ConversationParticipant (many-to-many với User). |
| 26 | **Message** | Entity quản lý tin nhắn trong cuộc trò chuyện. Có quan hệ **belongsTo** với Conversation (conversation_id), User (sender_id). Hỗ trợ tin nhắn văn bản và hình ảnh. |
| 27 | **ConversationParticipant** | Junction table quản lý người tham gia cuộc trò chuyện (many-to-many giữa Conversation và User). Có quan hệ **belongsTo** với User (user_id), Conversation (conversation_id). Đảm bảo mỗi user chỉ tham gia một lần mỗi conversation. |
| 28 | **ComplaintType** | Entity quản lý loại khiếu nại. Có quan hệ **belongsTo** với School (school_id). Có quan hệ **hasMany** với Complaint. Phân loại theo category (teacher/parent). |
| 29 | **Complaint** | Entity quản lý khiếu nại từ phụ huynh hoặc giáo viên. Có quan hệ **belongsTo** với ComplaintType (complaint_type_id), School (school_id), User (user_id). Chứa trạng thái xử lý (pending/approve/reject) và phản hồi. |
| 30 | **DailyReport** | Entity quản lý báo cáo hàng ngày của học sinh. Có quan hệ **belongsTo** với Student (student_id), Teacher (teacher_checkin_id, teacher_checkout_id). Lưu thời gian check-in, check-out và nhận xét. |
| 31 | **HealthRecord** | Entity quản lý hồ sơ sức khỏe định kỳ của học sinh. Có quan hệ **belongsTo** với Student (student_id), HealthCareStaff (health_care_staff_id). Lưu thông tin chiều cao, cân nặng và ghi chú. |
| 32 | **HealthNotice** | Entity quản lý thông báo sức khỏe khẩn cấp của học sinh. Có quan hệ **belongsTo** với Student (student_id), HealthCareStaff (health_care_staff_id). Lưu triệu chứng, hành động đã thực hiện và thuốc đã dùng. |
| 33 | **Pickup** | Entity quản lý thông tin người đón học sinh. Có quan hệ **hasMany** với PickupStudent (many-to-many với Student). Lưu thông tin: tên, mối quan hệ, CMND, số điện thoại, avatar. |
| 34 | **PickupStudent** | Junction table kết nối Pickup và Student (many-to-many). Có quan hệ **belongsTo** với Pickup (pickup_id), Student (student_id). Đảm bảo mỗi người đón có thể đón nhiều học sinh và mỗi học sinh có thể có nhiều người đón. |
| 35 | **ParentStudent** | Junction table kết nối Parent và Student (many-to-many). Có quan hệ **belongsTo** với Parent (parent_id), Student (student_id). Lưu mối quan hệ (cha, mẹ, người giám hộ). Đảm bảo mỗi phụ huynh có thể có nhiều con và mỗi học sinh có thể có nhiều phụ huynh. |
| 36 | **StudentClass** | Junction table kết nối Student và Class (many-to-many). Có quan hệ **belongsTo** với Student (student_id), Class (class_id). Lưu thông tin giảm giá (discount) cho học sinh trong lớp. Có quan hệ **hasMany** với Invoice. Đảm bảo mỗi học sinh chỉ học một lớp tại một thời điểm. |

## Tóm tắt các quan hệ chính:

### Quan hệ Many-to-Many (qua Junction Tables):
- **Parent ↔ Student**: Qua `ParentStudent`
- **Student ↔ Class**: Qua `StudentClass`
- **Student ↔ Pickup**: Qua `PickupStudent`
- **User ↔ Conversation**: Qua `ConversationParticipant`
- **Post ↔ User** (likes): Qua `PostLike`
- **ClassAgeMeal ↔ Dish**: Qua `DishesClassAgeMeal`

### Quan hệ One-to-One:
- **User ↔ Parent**: Qua `Parent.user_id`
- **User ↔ Teacher**: Qua `Teacher.user_id`
- **User ↔ HealthCareStaff**: Qua `HealthCareStaff.user_id`

### Quan hệ One-to-Many chính:
- **School → User, Student, Class, ClassAge, Activity, Dish, Fee, Slot, ComplaintType**
- **Class → Calendar, StudentClass, Post, Conversation, ClassFee**
- **Student → ParentStudent, StudentClass, DailyReport, HealthRecord, HealthNotice, PickupStudent**
- **User → Post, Message, PostLike, PostComment, Complaint**
- **ClassAge → Class, ClassAgeMeal**
- **Meal → Dish, ClassAgeMeal**
- **Fee → ClassFee**
- **ClassFee → Invoice**
- **Post → PostImage, PostComment, PostLike**
- **Conversation → Message, ConversationParticipant**
- **ComplaintType → Complaint**



