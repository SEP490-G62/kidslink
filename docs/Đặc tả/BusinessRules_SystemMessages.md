# KidsLink - Business Rules & System Messages

## 5.1 Business Rules

### USER MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-USER-01** | Users must create an account with valid email, phone number (Vietnamese format), and strong password (8-16 characters with uppercase, lowercase, number, and special character). |
| **BR-USER-02** | Username must be unique across the system and contain only alphanumeric characters, dots, underscores, and hyphens. |
| **BR-USER-03** | User roles are limited to: school_admin, teacher, parent, health_care_staff, nutrition_staff, and admin. |
| **BR-USER-04** | Email and phone number must be unique per user. Duplicate email or phone number registration is not allowed. |
| **BR-USER-05** | User account status must be "Active" (status = 1) to log in. Locked accounts (status = 0) cannot access the system. |
| **BR-USER-06** | Password reset generates a random password sent to user's email; user should change it after first login. |
| **BR-USER-07** | JWT token expires after configured time (default 1 hour); user must re-authenticate after expiration. |
| **BR-USER-08** | Admin credentials can be configured via environment variables (.env) for system-level access. |

### SCHOOL MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-SCHOOL-01** | Each school must have a unique school_id. School_admin users must be assigned to a school (school_id). |
| **BR-SCHOOL-02** | School status must be "Active" (status = 1) for users of that school to log in. |
| **BR-SCHOOL-03** | School_admin can only manage users, classes, students, and data within their assigned school. |
| **BR-SCHOOL-04** | School information (name, address, phone_number, avatar_url) can only be updated by school_admin or system admin. |
| **BR-SCHOOL-05** | School phone number must follow Vietnamese mobile format: (+84|0)(3|5|7|8|9)xxxxxxxx. |

### STUDENT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-STUDENT-01** | Student full_name, date_of_birth, and gender are required fields. Gender is numeric: 0 (male), 1 (female). |
| **BR-STUDENT-02** | Student date_of_birth must be a valid date in the past (not future date). |
| **BR-STUDENT-03** | Student can only be created, updated, or deleted by school_admin of the same school. |
| **BR-STUDENT-04** | Student must be assigned to a class via StudentClass relationship before appearing in class lists. |
| **BR-STUDENT-05** | Student avatar_url is optional and defaults to empty string. |
| **BR-STUDENT-06** | Parent-student relationship is managed via ParentStudent table with relationship types: father, mother, guardian, other. |
| **BR-STUDENT-07** | Authorized pickup persons for students are managed via Pickup and PickupStudent tables. |
| **BR-STUDENT-08** | When deleting a student, related records (StudentClass, ParentStudent, PickupStudent) should be handled appropriately. |

### PARENT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-PARENT-01** | Parent accounts are automatically created when students are registered with parent information. |
| **BR-PARENT-02** | Parent username is auto-generated from phone number or email if not specified. Username must be at least 4 characters. |
| **BR-PARENT-03** | Parent can be linked to multiple students via ParentStudent relationship. |
| **BR-PARENT-04** | Parent can only view and manage information of their own children. |
| **BR-PARENT-05** | Parent can add, edit, delete authorized pickup persons for their children. |
| **BR-PARENT-06** | Parent can create complaints/feedback requests to teachers or school admin. |

### TEACHER MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-TEACHER-01** | Teacher profile requires: qualification, major, experience_years (non-negative number), and note fields. |
| **BR-TEACHER-02** | Teacher accounts can only be created by school_admin; teachers belong to the school_admin's school. |
| **BR-TEACHER-03** | Teachers can be assigned to multiple classes but must be associated with their school. |
| **BR-TEACHER-04** | Teacher can create daily reports, take attendance, and communicate with parents of students in assigned classes. |
| **BR-TEACHER-05** | Experience_years must be a valid non-negative number (0 or greater). |

### CLASS MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-CLASS-01** | Class must have: class_name, academic_year, class_age_id, teacher_id, start_date, and end_date. |
| **BR-CLASS-02** | Class_age_id must reference a valid ClassAge record. |
| **BR-CLASS-03** | Classes can only be created, updated, or deleted by school_admin of the same school. |
| **BR-CLASS-04** | Class deletion should check for existing students; classes with active students should not be deleted without proper handling. |
| **BR-CLASS-05** | Classes must be associated with a school_id. |

### DAILY REPORT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-REPORT-01** | Daily reports require: student_id, report_date, and teacher_checkin_id fields. |
| **BR-REPORT-02** | Report_date must be a valid date; typically current or past dates. |
| **BR-REPORT-03** | Teachers can create and update daily reports for students in their assigned classes. |
| **BR-REPORT-04** | Parents can view daily reports for their own children only. |
| **BR-REPORT-05** | Daily report comments field is optional and can contain teacher's observations. |
| **BR-REPORT-06** | Daily reports track checkin_time, checkout_time, teacher_checkin_id, and teacher_checkout_id. |

### CALENDAR MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-CALENDAR-01** | Calendar events require: title, event_date, and description fields. |
| **BR-CALENDAR-02** | Event_date must be a valid date (can be future date for planned events). |
| **BR-CALENDAR-03** | School_admin can create, update, and delete calendar events for their school. |
| **BR-CALENDAR-04** | Teachers and parents can view calendar events but cannot modify them. |
| **BR-CALENDAR-05** | Calendar events are associated with a school_id. |

### SLOT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-SLOT-01** | Time slots require: slot_name, start_time, and end_time fields. |
| **BR-SLOT-02** | Start_time and end_time must be valid time formats (HH:MM). |
| **BR-SLOT-03** | End_time must be after start_time; slots cannot have negative duration. |
| **BR-SLOT-04** | Slots can only be created, updated, or deleted by school_admin. |
| **BR-SLOT-05** | Slots are used for building class schedules/timetables. |
| **BR-SLOT-06** | Slot deletion should check for existing schedule references. |

### FEE MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-FEE-01** | Fees require: school_id, fee_name, description, and amount fields. |
| **BR-FEE-02** | Fee amount must be a positive number greater than zero (stored as Decimal128). |
| **BR-FEE-03** | School_admin can create, update, and manage fees for all students in their school. |
| **BR-FEE-04** | Parents can view fees for their own children and make payments. |
| **BR-FEE-05** | Late fee configuration includes: late_fee_type (none, fixed, percentage), late_fee_value, and late_fee_description. |

### POST & COMMENT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-POST-01** | Posts require content field (cannot be empty). |
| **BR-POST-02** | Post status can be: pending or approved. Default is pending. |
| **BR-POST-03** | School_admin creates posts that can be sent to parents and teachers; these may require approval. |
| **BR-POST-04** | Teachers and parents can create posts on the newsfeed. |
| **BR-POST-05** | Users can only edit or delete their own posts. |
| **BR-POST-06** | Comments require: post_id and contents (non-empty text). |
| **BR-POST-07** | Users can create, edit, and delete their own comments. |
| **BR-POST-08** | Comments can be replies to other comments (parent_comment_id). |
| **BR-POST-09** | Parent_comment_id must be a valid MongoDB ObjectId if provided. |
| **BR-POST-10** | Only approved posts are displayed on the public newsfeed. |
| **BR-POST-11** | Posts can be associated with a class_id (optional). |

### LIKE MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-LIKE-01** | Users can like or unlike posts. |
| **BR-LIKE-02** | A user can only like a post once; attempting to like again should fail or have no effect. |
| **BR-LIKE-03** | Users can unlike a post they have previously liked. |
| **BR-LIKE-04** | Unliking a post that hasn't been liked should fail or have no effect. |
| **BR-LIKE-05** | Post_id must reference a valid existing post. |

### COMPLAINT MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-COMPLAINT-01** | Complaints require: complaint_type_id, school_id, complaintTypeName, and reason (non-empty text). |
| **BR-COMPLAINT-02** | Complaint_type_id must reference a valid ComplaintType record. |
| **BR-COMPLAINT-03** | ComplaintType records define categories for complaints/feedback (e.g., "facility issue", "teacher behavior", "child safety"). |
| **BR-COMPLAINT-04** | Complaint types can be filtered by user type: teacher, parent, or all. |
| **BR-COMPLAINT-05** | Parents and teachers can create complaints based on their allowed complaint types. |
| **BR-COMPLAINT-06** | School_admin can view, manage, update status, and respond to complaints. |
| **BR-COMPLAINT-07** | Complaint status values include: pending, approve, reject. Default is pending. |
| **BR-COMPLAINT-08** | School_admin can add response text to complaints when updating status. |
| **BR-COMPLAINT-09** | School_admin can create, edit, and delete complaint types. |
| **BR-COMPLAINT-10** | Complaints can include optional image attachment (single image URL). |

### HEALTH CARE MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-HEALTH-01** | Health records require: student_id, checkup_date, height_cm, weight_kg, note, and health_care_staff_id fields. |
| **BR-HEALTH-02** | Height (height_cm) and weight (weight_kg) must be positive numbers greater than zero (stored as Decimal128). |
| **BR-HEALTH-03** | Health_care_staff can create and update health records for students in their school. |
| **BR-HEALTH-04** | Parents and teachers can view health records for their associated students. |
| **BR-HEALTH-05** | Health record note field is required and can contain observations, medical conditions, or special care instructions. |

### NUTRITION MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-NUTRITION-01** | Meal plans require: class_age_id, meal_id, weekday_id, and date fields. |
| **BR-NUTRITION-02** | Class_age_id must reference a valid ClassAge record. |
| **BR-NUTRITION-03** | Meal_id must reference a valid Meal record. |
| **BR-NUTRITION-04** | Weekday_id must reference a valid WeekDay record. |
| **BR-NUTRITION-05** | Date must be a valid date (can be future for meal planning). |
| **BR-NUTRITION-06** | Nutrition_staff can create and update meal plans for class age groups. |
| **BR-NUTRITION-07** | Nutrition_staff can manage dish catalog including ingredients, nutrition info, and allergy warnings. |
| **BR-NUTRITION-08** | Parents and teachers can view meal plans for their associated classes/students. |

### MESSAGING MANAGEMENT
| ID | Rule Definition |
|---|---|
| **BR-MESSAGE-01** | Messages require: conversation_id and content (non-empty text). |
| **BR-MESSAGE-02** | Conversation_id must reference a valid Conversation record. |
| **BR-MESSAGE-03** | Users can only send messages to conversations they are participants in. |
| **BR-MESSAGE-04** | Conversation participants are managed via ConversationParticipant table. |
| **BR-MESSAGE-05** | Teachers can message parents of students in their assigned classes. |
| **BR-MESSAGE-06** | Parents can message teachers of their children's classes. |
| **BR-MESSAGE-07** | Users can mark messages as read in conversations they participate in. |
| **BR-MESSAGE-08** | Message content cannot be empty or null. |

### AUTHENTICATION & AUTHORIZATION
| ID | Rule Definition |
|---|---|
| **BR-AUTH-01** | All API endpoints require valid JWT token in Authorization header (except login, register, forgot password). |
| **BR-AUTH-02** | JWT token must not be expired; expired tokens return 401 Unauthorized. |
| **BR-AUTH-03** | Token verification checks: token format, signature, expiration, and user existence. |
| **BR-AUTH-04** | Users can only access resources and perform actions allowed by their role. |
| **BR-AUTH-05** | School_admin can only manage resources within their assigned school. |
| **BR-AUTH-06** | Teachers can only access data for students in their assigned classes. |
| **BR-AUTH-07** | Parents can only access data for their own children. |
| **BR-AUTH-08** | Cross-school data access is prohibited unless user is system admin. |

### DATA VALIDATION
| ID | Rule Definition |
|---|---|
| **BR-VALID-01** | All MongoDB ObjectId fields must be valid 24-character hex strings. |
| **BR-VALID-02** | Invalid ObjectId format returns 400 Bad Request error. |
| **BR-VALID-03** | Required fields cannot be null, undefined, or empty strings. |
| **BR-VALID-04** | String fields must pass type validation; numeric types for numeric fields. |
| **BR-VALID-05** | Email fields must match valid email format (RFC 5322 standard). |
| **BR-VALID-06** | Phone number fields must match Vietnamese mobile number format. |
| **BR-VALID-07** | URL fields must be valid URLs (http/https protocol). |
| **BR-VALID-08** | Date fields must be valid ISO date strings or Date objects. |
| **BR-VALID-09** | Enum fields must match allowed values defined in validation rules. |

### ERROR HANDLING
| ID | Rule Definition |
|---|---|
| **BR-ERROR-01** | Validation errors return 400 Bad Request with detailed error array. |
| **BR-ERROR-02** | Authentication failures return 401 Unauthorized. |
| **BR-ERROR-03** | Authorization failures return 403 Forbidden. |
| **BR-ERROR-04** | Resource not found errors return 404 Not Found. |
| **BR-ERROR-05** | Duplicate resource errors (username, email, phone) return 409 Conflict. |
| **BR-ERROR-06** | Server errors return 500 Internal Server Error with generic message. |
| **BR-ERROR-07** | Error responses include: statusCode, error message, and optional details array. |

## 5.2 System Messages

| # | Message Code | Message Type | Context | Content |
|---|---|---|---|---|
| 1 | MSG-01 | info | No Data | Không có dữ liệu. |
| 2 | MSG-02 | warning | Form Validation | Trường này là bắt buộc. |
| 3 | MSG-03 | error | Form Validation | Định dạng nhập không hợp lệ. |
| 4 | MSG-04 | success | User Registration | Đăng ký thành công! |
| 5 | MSG-05 | success | User Login | Đăng nhập thành công! |
| 6 | MSG-06 | error | User Login | Tên đăng nhập hoặc mật khẩu không đúng. |
| 7 | MSG-07 | error | User Login | Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên. |
| 8 | MSG-08 | error | User Login | Trường học đã bị vô hiệu hóa. Vui lòng liên hệ quản trị hệ thống. |
| 9 | MSG-09 | error | Token Validation | Token không khả dụng. |
| 10 | MSG-10 | error | Token Validation | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| 11 | MSG-11 | error | Token Validation | Token không hợp lệ. Vui lòng đăng nhập lại. |
| 12 | MSG-12 | success | Password Reset | Email đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn. |
| 13 | MSG-13 | error | Password Reset | Không tìm thấy email. Vui lòng kiểm tra và thử lại. |
| 14 | MSG-14 | success | Password Change | Đổi mật khẩu thành công! |
| 15 | MSG-15 | error | Password Change | Mật khẩu cũ không đúng. |
| 16 | MSG-16 | error | Password Validation | Mật khẩu phải có 8-16 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt. |
| 17 | MSG-17 | error | Duplicate Data | Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác. |
| 18 | MSG-18 | error | Duplicate Data | Email đã tồn tại. Vui lòng sử dụng email khác. |
| 19 | MSG-19 | error | Duplicate Data | Số điện thoại đã tồn tại. Vui lòng sử dụng số điện thoại khác. |
| 20 | MSG-20 | error | Email Validation | Email không hợp lệ. |
| 21 | MSG-21 | error | Phone Validation | Số điện thoại phải theo định dạng di động Việt Nam. |
| 22 | MSG-22 | error | URL Validation | URL phải là địa chỉ http hoặc https hợp lệ. |
| 23 | MSG-23 | success | Student Management | Tạo học sinh thành công! |
| 24 | MSG-24 | success | Student Management | Cập nhật học sinh thành công! |
| 25 | MSG-25 | success | Student Management | Xóa học sinh thành công! |
| 26 | MSG-26 | error | Student Management | Không tìm thấy học sinh. |
| 27 | MSG-27 | error | Student Management | Học sinh không thuộc trường của bạn. |
| 28 | MSG-28 | error | Date Validation | Ngày sinh phải là ngày hợp lệ trong quá khứ. |
| 29 | MSG-29 | error | Gender Validation | Giới tính phải là: nam, nữ hoặc khác. |
| 30 | MSG-30 | success | Class Management | Tạo lớp học thành công! |
| 31 | MSG-31 | success | Class Management | Cập nhật lớp học thành công! |
| 32 | MSG-32 | success | Class Management | Xóa lớp học thành công! |
| 33 | MSG-33 | error | Class Management | Không tìm thấy lớp học. |
| 34 | MSG-34 | error | Class Management | Không thể xóa lớp có học sinh đang học. |
| 35 | MSG-35 | error | Number Validation | Sĩ số tối đa phải là số dương. |
| 36 | MSG-36 | success | Teacher Management | Tạo giáo viên thành công! |
| 37 | MSG-37 | success | Teacher Management | Cập nhật giáo viên thành công! |
| 38 | MSG-38 | success | Teacher Management | Xóa giáo viên thành công! |
| 39 | MSG-39 | error | Teacher Management | Không tìm thấy giáo viên. |
| 40 | MSG-40 | error | Teacher Profile | Thiếu thông tin hồ sơ giáo viên (trình độ, chuyên ngành, số năm kinh nghiệm). |
| 41 | MSG-41 | error | Number Validation | Số năm kinh nghiệm phải là số không âm. |
| 42 | MSG-42 | success | Parent Management | Tạo phụ huynh thành công! |
| 43 | MSG-43 | error | Parent Management | Không tìm thấy phụ huynh. |
| 44 | MSG-44 | error | Username Validation | Tên đăng nhập phải có ít nhất 4 ký tự. |
| 45 | MSG-45 | error | Username Validation | Tên đăng nhập chỉ được chứa chữ, số, dấu chấm, gạch dưới và gạch ngang. |
| 46 | MSG-46 | success | Daily Report | Tạo nhận xét hàng ngày thành công! |
| 47 | MSG-47 | success | Daily Report | Cập nhật nhận xét hàng ngày thành công! |
| 48 | MSG-48 | error | Daily Report | Không tìm thấy nhận xét hàng ngày. |
| 49 | MSG-49 | error | Health Status Validation | Tình trạng sức khỏe phải là giá trị hợp lệ. |
| 50 | MSG-50 | success | Calendar Management | Tạo sự kiện lịch thành công! |
| 51 | MSG-51 | success | Calendar Management | Cập nhật sự kiện lịch thành công! |
| 52 | MSG-52 | success | Calendar Management | Xóa sự kiện lịch thành công! |
| 53 | MSG-53 | error | Calendar Management | Không tìm thấy sự kiện lịch. |
| 54 | MSG-54 | success | Slot Management | Tạo tiết học thành công! |
| 55 | MSG-55 | success | Slot Management | Cập nhật tiết học thành công! |
| 56 | MSG-56 | success | Slot Management | Xóa tiết học thành công! |
| 57 | MSG-57 | error | Slot Management | Không tìm thấy tiết học. |
| 58 | MSG-58 | error | Time Validation | Giờ kết thúc phải sau giờ bắt đầu. |
| 59 | MSG-59 | error | Time Validation | Định dạng giờ không hợp lệ. Sử dụng định dạng HH:MM. |
| 60 | MSG-60 | success | Fee Management | Tạo khoản thu thành công! |
| 61 | MSG-61 | success | Fee Management | Cập nhật khoản thu thành công! |
| 62 | MSG-62 | error | Fee Management | Không tìm thấy khoản thu. |
| 63 | MSG-63 | error | Amount Validation | Số tiền phải là số dương. |
| 64 | MSG-64 | error | Fee Type Validation | Loại khoản thu không hợp lệ. |
| 65 | MSG-65 | success | Payment Processing | Xử lý thanh toán thành công! |
| 66 | MSG-66 | error | Payment Processing | Số tiền thanh toán không khớp với khoản thu. |
| 67 | MSG-67 | error | Payment Processing | Phương thức thanh toán không hợp lệ. |
| 68 | MSG-68 | success | Post Management | Tạo bài viết thành công! |
| 69 | MSG-69 | success | Post Management | Cập nhật bài viết thành công! |
| 70 | MSG-70 | success | Post Management | Xóa bài viết thành công! |
| 71 | MSG-71 | error | Post Management | Không tìm thấy bài viết. |
| 72 | MSG-72 | error | Post Validation | Tiêu đề bài viết không được để trống. |
| 73 | MSG-73 | error | Post Validation | Nội dung bài viết không được để trống. |
| 74 | MSG-74 | error | Authorization | Bạn chỉ có thể chỉnh sửa hoặc xóa bài viết của mình. |
| 75 | MSG-75 | success | Comment Management | Tạo bình luận thành công! |
| 76 | MSG-76 | success | Comment Management | Cập nhật bình luận thành công! |
| 77 | MSG-77 | success | Comment Management | Xóa bình luận thành công! |
| 78 | MSG-78 | error | Comment Management | Không tìm thấy bình luận. |
| 79 | MSG-79 | error | Comment Validation | Nội dung bình luận không được để trống. |
| 80 | MSG-80 | error | Authorization | Bạn chỉ có thể chỉnh sửa hoặc xóa bình luận của mình. |
| 81 | MSG-81 | error | ObjectId Validation | ID bình luận cha không hợp lệ. |
| 82 | MSG-82 | success | Like Management | Đã thích bài viết! |
| 83 | MSG-83 | success | Like Management | Đã bỏ thích bài viết! |
| 84 | MSG-84 | error | Like Management | Bạn đã thích bài viết này rồi. |
| 85 | MSG-85 | error | Like Management | Bạn chưa thích bài viết này. |
| 86 | MSG-86 | success | Complaint Management | Gửi đơn thành công! |
| 87 | MSG-87 | success | Complaint Management | Cập nhật đơn thành công! |
| 88 | MSG-88 | error | Complaint Management | Không tìm thấy đơn. |
| 89 | MSG-89 | error | Complaint Validation | Mô tả không được để trống. |
| 90 | MSG-90 | error | Complaint Type | Không tìm thấy loại đơn. |
| 91 | MSG-91 | error | Status Validation | Trạng thái đơn không hợp lệ. |
| 92 | MSG-92 | success | Complaint Type Management | Tạo loại đơn thành công! |
| 93 | MSG-93 | success | Complaint Type Management | Cập nhật loại đơn thành công! |
| 94 | MSG-94 | success | Complaint Type Management | Xóa loại đơn thành công! |
| 95 | MSG-95 | error | Complaint Type Validation | Tên loại đơn không được để trống. |
| 96 | MSG-96 | error | Complaint Type Validation | Phải chọn loại người dùng. |
| 97 | MSG-97 | success | Health Care | Tạo hồ sơ sức khỏe thành công! |
| 98 | MSG-98 | success | Health Care | Cập nhật hồ sơ sức khỏe thành công! |
| 99 | MSG-99 | error | Health Care | Không tìm thấy hồ sơ sức khỏe. |
| 100 | MSG-100 | error | Number Validation | Chiều cao phải là số dương. |
| 101 | MSG-101 | error | Number Validation | Cân nặng phải là số dương. |
| 102 | MSG-102 | success | Nutrition Management | Tạo thực đơn thành công! |
| 103 | MSG-103 | success | Nutrition Management | Cập nhật thực đơn thành công! |
| 104 | MSG-104 | error | Nutrition Management | Không tìm thấy thực đơn. |
| 105 | MSG-105 | error | Nutrition Validation | Phải chọn ít nhất một món ăn. |
| 106 | MSG-106 | error | Nutrition Validation | Không tìm thấy món ăn. |
| 107 | MSG-107 | error | ObjectId Validation | ID độ tuổi lớp không hợp lệ. |
| 108 | MSG-108 | success | Dish Management | Tạo món ăn thành công! |
| 109 | MSG-109 | success | Dish Management | Cập nhật món ăn thành công! |
| 110 | MSG-110 | success | Dish Management | Xóa món ăn thành công! |
| 111 | MSG-111 | error | Dish Management | Không tìm thấy món ăn. |
| 112 | MSG-112 | success | Messaging | Gửi tin nhắn thành công! |
| 113 | MSG-113 | error | Messaging | Không tìm thấy cuộc trò chuyện. |
| 114 | MSG-114 | error | Messaging | Nội dung tin nhắn không được để trống. |
| 115 | MSG-115 | error | Authorization | Bạn không phải thành viên của cuộc trò chuyện này. |
| 116 | MSG-116 | success | Messaging | Đã đánh dấu tin nhắn là đã đọc. |
| 117 | MSG-117 | error | Messaging | Không tìm thấy tin nhắn. |
| 118 | MSG-118 | error | ObjectId Validation | Định dạng ObjectId không hợp lệ. |
| 119 | MSG-119 | error | Authorization | Bạn không có quyền truy cập. |
| 120 | MSG-120 | error | Authorization | Quản trị viên trường chưa được gán vào trường. |
| 121 | MSG-121 | error | School Validation | Không tìm thấy trường học. |
| 122 | MSG-122 | error | School Validation | ID trường học không hợp lệ. |
| 123 | MSG-123 | error | Authorization | Người dùng không thuộc trường của bạn. |
| 124 | MSG-124 | error | Authorization | Quản trị viên trường không thể quản lý vai trò người dùng này. |
| 125 | MSG-125 | error | Role Validation | Vai trò không hợp lệ. Các vai trò cho phép: school_admin, teacher, parent, health_care_staff, nutrition_staff, admin. |
| 126 | MSG-126 | success | Profile Update | Cập nhật hồ sơ thành công! |
| 127 | MSG-127 | error | Profile Update | Không thể cập nhật hồ sơ. Vui lòng thử lại. |
| 128 | MSG-128 | error | Database Error | Lỗi cơ sở dữ liệu. Vui lòng thử lại hoặc liên hệ hỗ trợ. |
| 129 | MSG-129 | error | Server Error | Lỗi máy chủ. Vui lòng liên hệ hỗ trợ. |
| 130 | MSG-130 | info | Session Expired | Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại. |
| 131 | MSG-131 | warning | Field Length Validation | Vượt quá độ dài tối đa {max_length} ký tự. |
| 132 | MSG-132 | error | Array Validation | Định dạng mảng không hợp lệ. |
| 133 | MSG-133 | error | Pickup Management | Không tìm thấy người đón. |
| 134 | MSG-134 | success | Pickup Management | Thêm người đón thành công! |
| 135 | MSG-135 | success | Pickup Management | Cập nhật người đón thành công! |
| 136 | MSG-136 | success | Pickup Management | Xóa người đón thành công! |
| 137 | MSG-137 | error | Relationship Validation | Loại quan hệ không hợp lệ. Phải là: bố, mẹ, người giám hộ hoặc khác. |
| 138 | MSG-138 | success | School Management | Cập nhật thông tin trường thành công! |
| 139 | MSG-139 | error | School Management | Không thể cập nhật thông tin trường. |
| 140 | MSG-140 | error | File Upload | Tải file thất bại. Vui lòng thử lại. |
| 141 | MSG-141 | error | File Validation | Định dạng file không hợp lệ. |
| 142 | MSG-142 | error | File Validation | Kích thước file vượt quá giới hạn cho phép. |
| 143 | MSG-143 | success | Image Upload | Tải ảnh thành công! |
| 144 | MSG-144 | info | Loading | Đang tải dữ liệu... |
| 145 | MSG-145 | success | Data Refresh | Làm mới dữ liệu thành công! |
| 146 | MSG-146 | error | Network Error | Lỗi mạng. Vui lòng kiểm tra kết nối của bạn. |
| 147 | MSG-147 | warning | Confirmation | Bạn có chắc muốn xóa mục này không? |
| 148 | MSG-148 | warning | Confirmation | Bạn có chắc muốn thực hiện hành động này không? |
| 149 | MSG-149 | success | Save Successful | Lưu thay đổi thành công! |
| 150 | MSG-150 | error | Save Failed | Không thể lưu thay đổi. Vui lòng thử lại. |
| 151 | MSG-151 | error | Form Validation | Tên đăng nhập là bắt buộc. |
| 152 | MSG-152 | error | Form Validation | Mật khẩu là bắt buộc. |
| 153 | MSG-153 | error | Form Validation | Mật khẩu phải có ít nhất 6 ký tự. |
| 154 | MSG-154 | error | Login Failed | Đăng nhập thất bại. |
| 155 | MSG-155 | error | Post Validation | Vui lòng nhập nội dung bài viết. |
| 156 | MSG-156 | error | Post Management | Có lỗi xảy ra khi xóa bài viết. |
| 157 | MSG-157 | error | Post Management | Lỗi không xác định. |
| 158 | MSG-158 | error | Post Management | Có lỗi xảy ra khi lấy danh sách bài đăng. |
| 159 | MSG-159 | error | Post Management | Có lỗi xảy ra khi lấy bài viết của bạn. |
| 160 | MSG-160 | error | Like Management | Có lỗi xảy ra khi xử lý like. |
| 161 | MSG-161 | error | Like Management | Có lỗi xảy ra khi lấy danh sách like. |
| 162 | MSG-162 | error | Comment Management | Có lỗi xảy ra khi tạo comment. |
| 163 | MSG-163 | error | Comment Management | Có lỗi xảy ra khi lấy danh sách comment. |
| 164 | MSG-164 | error | Comment Management | Có lỗi xảy ra khi cập nhật comment. |
| 165 | MSG-165 | error | Comment Management | Có lỗi xảy ra khi xóa comment. |
| 166 | MSG-166 | error | Post Management | Có lỗi xảy ra khi tạo bài đăng. |
| 167 | MSG-167 | error | Post Management | Có lỗi xảy ra khi cập nhật bài đăng. |
| 168 | MSG-168 | error | Post Management | Có lỗi xảy ra. Vui lòng thử lại. |
| 169 | MSG-169 | error | Complaint Management | Có lỗi xảy ra khi tải danh sách loại đơn. |
| 170 | MSG-170 | error | Complaint Management | Có lỗi xảy ra khi tải danh sách đơn. |
| 171 | MSG-171 | error | Complaint Management | Vui lòng chọn file ảnh. |
| 172 | MSG-172 | error | Complaint Management | Vui lòng chọn loại đơn. |
| 173 | MSG-173 | error | Complaint Management | Vui lòng nhập lý do hoặc nội dung. |
| 174 | MSG-174 | error | Complaint Management | Có lỗi xảy ra khi gửi đơn. |
| 175 | MSG-175 | error | Complaint Management | Có lỗi xảy ra khi lấy danh sách loại đơn. |
| 176 | MSG-176 | error | Complaint Management | Có lỗi xảy ra khi lấy chi tiết đơn. |
| 177 | MSG-177 | error | Validation | User ID không hợp lệ. |
| 178 | MSG-178 | error | Parent Management | Có lỗi xảy ra khi lấy danh sách con. |
| 179 | MSG-179 | error | Parent Management | Có lỗi xảy ra khi lấy thông tin cá nhân. |
| 180 | MSG-180 | error | Parent Management | Có lỗi xảy ra khi cập nhật thông tin cá nhân. |
| 181 | MSG-181 | error | Password Change | Có lỗi xảy ra khi đổi mật khẩu. |
| 182 | MSG-182 | error | Student Management | Có lỗi xảy ra khi lấy thông tin học sinh. |
| 183 | MSG-183 | error | Pickup Management | Có lỗi xảy ra khi thêm người đón. |
| 184 | MSG-184 | error | Pickup Management | Có lỗi xảy ra khi cập nhật người đón. |
| 185 | MSG-185 | error | Pickup Management | Có lỗi xảy ra khi xóa người đón. |
| 186 | MSG-186 | error | Daily Report | Lỗi lấy daily reports. |
| 187 | MSG-187 | error | Calendar Management | Lỗi lấy lịch lớp. |
| 188 | MSG-188 | error | Nutrition Management | Lỗi lấy thực đơn tuần. |
| 189 | MSG-189 | error | Fee Management | Có lỗi xảy ra khi lấy danh sách khoản thu. |
| 190 | MSG-190 | error | Payment Processing | Có lỗi xảy ra khi tạo yêu cầu thanh toán. |
| 191 | MSG-191 | error | Payment Processing | order_code không hợp lệ. |
| 192 | MSG-192 | error | Messaging | Có lỗi xảy ra khi lấy danh sách cuộc trò chuyện. |
| 193 | MSG-193 | error | Messaging | Có lỗi xảy ra khi lấy thông tin cuộc trò chuyện. |
| 194 | MSG-194 | error | Messaging | Có lỗi xảy ra khi lấy danh sách tin nhắn. |
| 195 | MSG-195 | error | Messaging | Có lỗi xảy ra khi gửi tin nhắn. |
| 196 | MSG-196 | error | Messaging | Có lỗi xảy ra khi đánh dấu đã đọc. |
| 197 | MSG-197 | error | Messaging | Có lỗi xảy ra khi lấy số lượng tin nhắn chưa đọc. |
| 198 | MSG-198 | error | Messaging | Có lỗi xảy ra khi tạo nhóm chat cho lớp. |
| 199 | MSG-199 | error | Messaging | Có lỗi xảy ra khi tạo trò chuyện. |
| 200 | MSG-200 | error | Messaging | Có lỗi xảy ra khi lấy danh sách giáo viên. |
| 201 | MSG-201 | error | Messaging | Có lỗi xảy ra khi lấy danh sách phụ huynh. |
| 202 | MSG-202 | error | Health Care | Lỗi lấy danh sách lớp. |
| 203 | MSG-203 | error | Health Care | Lỗi lấy học sinh theo lớp. |
| 204 | MSG-204 | error | Health Care | Lỗi lấy hồ sơ sức khỏe. |
| 205 | MSG-205 | error | Health Care | Lỗi tạo hồ sơ sức khỏe. |
| 206 | MSG-206 | error | Health Care | Lỗi cập nhật sổ sức khỏe. |
| 207 | MSG-207 | error | Health Care | Lỗi lấy thông báo y tế. |
| 208 | MSG-208 | error | Health Care | Lỗi tạo thông báo y tế. |
| 209 | MSG-209 | error | Health Care | Lỗi cập nhật thông báo y tế. |
| 210 | MSG-210 | error | Health Care | Lỗi lấy profile. |
| 211 | MSG-211 | error | Health Care | Lỗi cập nhật profile. |
| 212 | MSG-212 | error | Health Care | Lỗi đổi mật khẩu. |
| 213 | MSG-213 | error | Health Care | Lỗi xóa sổ sức khỏe. |
| 214 | MSG-214 | error | Health Care | Lỗi xóa thông báo y tế. |
| 215 | MSG-215 | success | Logout | Đăng xuất thành công. |
| 216 | MSG-216 | error | Fee Management | Không tìm thấy thông tin hóa đơn. |
| 217 | MSG-217 | error | Fee Management | Không tìm thấy phí nào phù hợp. |
| 218 | MSG-218 | error | Fee Management | Không tìm thấy thông tin phí. |
| 219 | MSG-219 | error | Form Validation | Phụ huynh cần có email để nhận thông tin. |
| 220 | MSG-220 | error | Slot Management | Không tìm thấy thông tin lớp học. |
| 221 | MSG-221 | error | Account Management | Bạn có chắc muốn kích hoạt tài khoản này không? |
| 222 | MSG-222 | error | Account Management | Bạn có chắc muốn vô hiệu hóa tài khoản này không? |
| 223 | MSG-223 | error | Account Management | Bạn có chắc muốn khóa tài khoản này không? |
| 224 | MSG-224 | error | Account Management | Không thể khóa tài khoản. |
| 225 | MSG-225 | error | Account Management | Không thể khôi phục tài khoản. |
| 226 | MSG-226 | error | Attendance | Check in thành công cho {student_name}. |
| 227 | MSG-227 | error | Attendance | Check out thành công cho {student_name}. |
| 228 | MSG-228 | error | Attendance | Vui lòng kiểm tra lại thông tin lớp học. |
| 229 | MSG-229 | error | Chat | Chưa đăng nhập. |
| 230 | MSG-230 | error | Chat | Lỗi kết nối socket. |
| 231 | MSG-231 | info | Daily Report | Vui lòng nhập nhận xét cho ít nhất một học sinh. |
| 232 | MSG-232 | error | Daily Report | Có lỗi khi thực hiện nhận xét hàng loạt! |
| 233 | MSG-233 | error | Daily Report | Lỗi khi cập nhật nhận xét! |
| 234 | MSG-234 | error | Profile Update | Vui lòng nhập mật khẩu mới. |
| 235 | MSG-235 | error | Profile Update | Vui lòng nhập mật khẩu hiện tại. |
| 236 | MSG-236 | error | Profile Update | Vui lòng kiểm tra lại thông tin mật khẩu. |
| 237 | MSG-237 | warning | Complaint Management | Vui lòng mô tả cụ thể thời gian, địa điểm hoặc các thông tin liên quan. |
| 238 | MSG-238 | info | Complaint Management | Hỗ trợ JPG, PNG, GIF (tối đa 5MB). |
| 239 | MSG-239 | info | Complaint Management | Nhà trường sẽ phản hồi trong mục "Danh sách đơn của tôi". Vui lòng kiểm tra thường xuyên để nhận thông báo mới. |
| 240 | MSG-240 | info | Loading | Vui lòng chờ trong giây lát. |
| 241 | MSG-241 | error | General Error | Có lỗi xảy ra. |
| 242 | MSG-242 | info | Complaint Management | Không tìm thấy đơn nào cho bộ lọc. |
| 243 | MSG-243 | error | Class Management | Không tìm thấy thông tin lớp học. |

---

**Document Version:** 1.0  
**Last Updated:** December 2, 2025  
**Project:** KidsLink - Preschool Management System  
**Authors:** SEP490-G62 Team
