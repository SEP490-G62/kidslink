# KidsLink Rewrite Plan

**Goal:** Viết lại toàn bộ hệ thống KidsLink (preschool connection platform) từ Node/Express/MongoDB/React-CRA sang Spring Boot + Next.js + PostgreSQL, giữ nguyên nghiệp vụ.

**Approach:** Làm theo đường dọc từng module. Backend dựng nền tảng (DB schema → entity → security → API), frontend dựng layout theo role rồi từng màn hình nghiệp vụ. Mỗi task là một lát cắt hoàn chỉnh, có tiêu chí nghiệm thu cụ thể, kết thúc bằng commit.

**Stack:**
- Backend: Java 21, Spring Boot 4.1.3 (Maven wrapper), Spring Security + JWT (jjwt), Spring Data JPA, Flyway, WebSocket STOMP, MinIO SDK, PayOS
- Frontend: Next.js 16.4.6 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, Recharts, STOMP/sockjs-client
- DB: PostgreSQL 16 (Docker, cổng host 5439)
- Storage: MinIO (Docker, cổng host 9000, bucket `kidslink`)
- Infra: docker compose tại `infra/docker-compose.yml`

**Spec gốc:** repo `github.com/SEP490-G62/kidslink` (clone đọc tại `%TEMP%\kidslink-src` khi cần tra cứu logic)

---

## Bối cảnh đã có (không cần làm lại)

- `infra/docker-compose.yml` — Postgres + MinIO đang chạy, đã verify healthy.
- `backend/` — Spring Boot 4.1.3 scaffold, `pom.xml` đầy đủ dependency (webmvc, data-jpa, security, validation, websocket, mail, actuator, flyway, postgresql, jjwt 0.12.6, minio 8.5.17, lombok), compile OK.
- `backend/src/main/resources/application.yml` — cấu hình đầy đủ: DB `localhost:5439/kidslink` (user/pass `kidslink`), JWT secret/TTL, MinIO endpoint/key, PayOS, seed flag, CORS `localhost:3000`.
- `frontend/` — Next.js 16 App Router scaffold, Tailwind v4, TypeScript, alias `@/*` → `src/*`, deps: tanstack query, stompjs, sockjs-client, recharts, date-fns, clsx, react-hook-form, zod.
- Git repo khởi tạo, commit nền `bdded40`.

## Quy ước kỹ thuật (MỌI task phải tuân)

1. **API prefix:** tất cả endpoint dưới `/api`. Base URL FE: `http://localhost:8080/api`.
2. **Response format:** trả về JSON thô của object/DTO (không bọc envelope `{data: ...}`), ĐÚNG như repo cũ, để frontend dễ port. Lỗi trả `{ "error": "message tiếng Việt" }`, validation trả `400 { "errors": [{ "field": "...", "message": "..." }] }` (Spring bean validation phải được format lại cho khớp).
3. **ID:** UUID (Postgres `uuid` + `gen_random_uuid()`), serialize dạng string.
4. **Thời gian:** `Instant`/`LocalDate`; JSON trả ISO-8601.
5. **Tiền:** `BigDecimal`, scale 2; JSON trả dạng number (cấu hình Jackson `WRITE_BIGDECIMAL_AS_PLAIN`).
6. **Ngày/giờ dạng chuỗi cố định** (giữ như cũ): `Slot.start_time`/`end_time`, `DailyReport.checkin_time`/`checkout_time`, `HealthNotice.notice_time`, `Payment.payment_time` → lưu `String` (`VARCHAR(10)`), không phải time.
7. **Trạng thái số** (giữ như cũ): User.status / Student.status / School.status / ClassFee.status = 1 active, 0 inactive. Invoice.status = 0 pending, 1 paid, 2 overdue. Payment.payment_method = 0 offline, 1 online. Student.gender = 0 male, 1 female. Message.read_status 0/1. PostLike/PostComment dùng `createdAt`.
8. **Role:** `admin`, `school_admin`, `teacher`, `parent`, `health_care_staff`, `nutrition_staff` — dùng enum `Role`, lưu string.
9. **JWT payload:** `{ id, role, username, full_name, school_id? }`, header `Authorization: Bearer <token>`. Token sống 24h (`app.jwt.access-token-ttl`).
10. **Multi-tenant:** mọi API của school user phải lọc theo `school_id` của user trong token; user không có school (admin) truy cập toàn bộ.
11. **Naming:** Java camelCase ↔ DB snake_case (Hibernate physical naming strategy mặc định).
12. **Sinh ID cho seed:** dùng `gen_random_uuid()`, không hard-code UUID trừ khi cần tham chiếu chéo.
13. **Ngôn ngữ message lỗi:** tiếng Việt, giữ đúng câu như repo cũ khi có thể.

---

## Task List

### PHASE 0 — Schema DB + Entity (P0)

**Task 0.1: Flyway migration toàn bộ schema**
- **Intent:** Dựng toàn bộ 37 bảng từ các Mongoose model cũ sang Postgres quan hệ.
- **Files:** `backend/src/main/resources/db/migration/V1__init_schema.sql`
- **Nội dung (chi tiết cột — bắt buộc dùng đúng):**
  - `schools(id uuid pk default gen_random_uuid(), school_name varchar(255) not null, address text not null, phone varchar(30) unique, email varchar(255) unique, logo_url text not null default '', status smallint not null default 1, qr_data text, payos_client_id varchar(255), payos_api_key varchar(255), payos_checksum_key varchar(255), payos_account_number varchar(64), payos_account_name varchar(255), payos_bank_code varchar(64), payos_active boolean not null default false, payos_webhook_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`
  - `class_ages(id, age int not null, age_name varchar(100) not null, school_id uuid not null ref schools, timestamps)`
  - `classes(id, class_name varchar(150) not null, academic_year varchar(20) not null, school_id uuid not null ref schools, class_age_id uuid not null ref class_ages, teacher_id uuid null ref teachers, co_teacher_id uuid null ref teachers, start_date date not null, end_date date not null, timestamps)` — `teacher_id`/`co_teacher_id` trỏ `teachers(id)`; **tạo bảng class trước teachers sẽ vướng FK** → dùng `ALTER TABLE` thêm FK sau khi tạo `teachers`.
  - `users(id, full_name varchar(255) not null, username varchar(100) unique, password_hash varchar(255), role varchar(32) not null check in (...), avatar_url text not null default '', status smallint not null default 1, email varchar(255) unique, phone_number varchar(30) unique, school_id uuid null ref schools, address text, timestamps)`
  - `parents(id, user_id uuid not null unique ref users, timestamps)`
  - `teachers(id, qualification varchar(255), major varchar(255), experience_years int default 0, note text, user_id uuid not null unique ref users, timestamps)`
  - `health_care_staffs(id, qualification, major, experience_years int, note text, user_id uuid not null unique ref users, timestamps)`
  - `students(id, full_name varchar(255) not null, school_id uuid ref schools, dob date not null, gender smallint not null, avatar_url text default '', status smallint not null default 1, allergy text default '', timestamps)`
  - `parent_students(id, parent_id uuid not null ref parents, student_id uuid not null ref students, relationship varchar(50) not null, timestamps, unique(parent_id, student_id))`
  - `student_classes(id, student_id uuid not null ref students, class_id uuid not null ref classes, discount numeric(5,2) not null default 0, timestamps, unique(student_id, class_id))`
  - `slots(id, slot_name varchar(100) not null, start_time varchar(10) not null, end_time varchar(10) not null, school_id uuid not null ref schools, timestamps)`
  - `activities(id, activity_name varchar(255) not null, description text not null, require_outdoor smallint default 0, school_id uuid not null ref schools, timestamps)`
  - `week_days(id, day_of_week varchar(20) not null, timestamps)`
  - `calendars(id, class_id uuid not null ref classes, weekday_id uuid not null ref week_days, date date not null, slot_id uuid not null ref slots, activity_id uuid not null ref activities, teacher_id uuid not null ref teachers, timestamps)`
  - `meals(id, meal varchar(100) not null, timestamps)`
  - `dishes(id, dish_name varchar(255) not null, description text not null, school_id uuid not null ref schools, timestamps)`
  - `dish_meals(dish_id uuid not null ref dishes, meal_id uuid not null ref meals, pk(dish_id, meal_id))` — Map cho `Dish.category: Meal[]`
  - `class_age_meals(id, class_age_id uuid not null ref class_ages, meal_id uuid not null ref meals, weekday_id uuid not null ref week_days, date date not null, timestamps)`
  - `dishes_class_age_meals(id, class_age_meal_id uuid not null ref class_age_meals on delete cascade, dish_id uuid not null ref dishes, timestamps, unique(class_age_meal_id, dish_id))`
  - `fees(id, school_id uuid not null ref schools, fee_name varchar(255) not null, description text not null, amount numeric(14,2) not null, late_fee_type varchar(20) not null default 'none', late_fee_value numeric(14,2) not null default 0, late_fee_description text default '', timestamps)`
  - `class_fees(id, class_id uuid not null ref classes, fee_id uuid not null ref fees, due_date date not null, note text, status smallint not null default 1, timestamps)`
  - `payments(id, payment_time varchar(10) not null, payment_method smallint not null default 1, total_amount numeric(14,2) not null, timestamps)`
  - `invoices(id, class_fee_id uuid not null ref class_fees, amount_due numeric(14,2) not null, due_date date not null, student_class_id uuid not null ref student_classes, discount numeric(5,2) not null default 0, payment_id uuid null ref payments, status smallint not null default 0, payos_order_code bigint, payos_checkout_url text, payos_qr_code text, payos_qr_url text, payos_expired_at timestamptz, payos_transaction_id varchar(255), late_fee_amount numeric(14,2), late_fee_applied_at timestamptz, timestamps)`
  - `posts(id, content text not null, status varchar(20) not null default 'pending' check in ('pending','approved'), user_id uuid not null ref users, class_id uuid null ref classes, timestamps)`
  - `post_images(id, image_url text not null, post_id uuid not null ref posts on delete cascade, timestamps)`
  - `post_comments(id, contents text not null, create_at timestamptz not null default now(), post_id uuid not null ref posts on delete cascade, user_id uuid not null ref users, parent_comment_id uuid null ref post_comments, timestamps)`
  - `post_likes(id, post_id uuid not null ref posts on delete cascade, user_id uuid not null ref users, timestamps, unique(post_id, user_id))`
  - `conversations(id, title varchar(255) not null, create_at timestamptz not null default now(), last_message_at timestamptz not null default now(), class_id uuid null ref classes, is_class_group boolean not null default false, timestamps)` — class_id nullable (chat 1-1 không thuộc lớp).
  - `conversation_participants(id, user_id uuid not null ref users, conversation_id uuid not null ref conversations on delete cascade, timestamps, unique(user_id, conversation_id))`
  - `messages(id, content text, image_url text, image_public_id text, send_at timestamptz not null default now(), read_status smallint not null default 0, conversation_id uuid not null ref conversations on delete cascade, sender_id uuid not null ref users, timestamps, check (content is not null or image_url is not null))`
  - `complaint_types(id, school_id uuid not null ref schools, name varchar(255) not null, description text, timestamps)`
  - `complaint_type_categories(complaint_type_id uuid not null ref complaint_types on delete cascade, category varchar(20) not null check in ('teacher','parent'), pk(complaint_type_id, category))` — Map cho `ComplaintType.category: string[]`
  - `complaints(id, complaint_type_id uuid not null ref complaint_types, school_id uuid not null ref schools, complaint_type_name varchar(255) not null, reason text not null, image text, status varchar(20) not null default 'pending' check in ('pending','approve','reject'), user_id uuid not null ref users, response text, timestamps)`
  - `daily_reports(id, report_date date not null, checkin_time varchar(10), checkout_time varchar(10), comments text, student_id uuid not null ref students, teacher_checkin_id uuid null ref teachers, teacher_checkout_id uuid null ref teachers, timestamps, unique(student_id, report_date))`
  - `health_records(id, checkup_date date not null, height_cm numeric(5,1) not null, weight_kg numeric(5,1) not null, note text not null, student_id uuid not null ref students, health_care_staff_id uuid not null ref health_care_staffs, timestamps)`
  - `health_notices(id, student_id uuid not null ref students, symptoms text not null, actions_taken text not null, medications text not null, notice_time varchar(10) not null, note text not null, health_care_staff_id uuid not null ref health_care_staffs, timestamps)`
  - `pickups(id, full_name varchar(255) not null, relationship varchar(50) not null, id_card_number varchar(30) unique not null, avatar_url text not null default '', phone varchar(30, timestamps)`
  - `pickup_students(id, pickup_id uuid not null ref pickups on delete cascade, student_id uuid not null ref students on delete cascade, timestamps, unique(pickup_id, student_id))`
- **Index cần có:** `users(school_id)`, `users(role)`, `students(school_id)`, `classes(school_id)`, `posts(class_id, created_at desc)`, `posts(user_id)`, `messages(conversation_id, send_at desc)`, `invoices(class_fee_id)`, `complaints(school_id)`, `calendars(class_id, date)`, `daily_reports(student_id, report_date)`.
- **Check:** `docker exec kidslink-postgres psql -U kidslink -d kidslink -c "\dt"` liệt kê đủ 37 bảng; app boot với `ddl-auto: validate` không lỗi.

**Task 0.2: JPA entities + repositories**
- **Intent:** Map 1-1 với schema; dùng Lombok `@Getter @Setter @NoArgsConstructor`; quan hệ dùng `@ManyToOne(fetch = LAZY)` + FK id, collection dùng `@OneToMany(mappedBy=...)` hoặc bảng join entity riêng (không dùng `@ManyToMany` trực tiếp khi bảng nối có cột phụ).
- **Files:** `backend/src/main/java/vn/kidslink/domain/entity/*.java` (37 file), `backend/src/main/java/vn/kidslink/domain/repository/*.java`
- **Lưu ý:** mọi entity kế thừa `BaseEntity` (`id uuid` `@GeneratedValue(strategy = UUID)`, `createdAt`, `updatedAt` với `@UpdateTimestamp`). Các entity chỉ có cột phụ dùng `@Embeddable` hoặc entity thường.
- **Check:** `sh mvnw -q compile` pass; boot app với DB đang chạy → validate schema OK.

### PHASE 1 — Nền tảng Backend (P1)

**Task 1.1: Common web layer**
- **Files:** `common/ApiError.java`, `common/GlobalExceptionHandler.java` (`@RestControllerAdvice`), `common/NotFoundException`, `common/BadRequestException`, `common/ForbiddenException`, `common/ConflictException`, `config/JacksonConfig`, `config/CorsConfig`, `config/OpenApiConfig` (không cần swagger, bỏ qua nếu nặng).
- **Chi tiết:** `MethodArgumentNotValidException` → 400 `{ "errors": [{field, message}] }`; custom exception → `{ "error": msg }` với HTTP tương ứng; lỗi khác → 500 `{ "error": "Lỗi server nội bộ", "message": ... }`.
- **Check:** viết test `@WebMvcTest` cho 1 controller giả lập, hoặc kiểm thủ công bằng curl.

**Task 1.2: Security + JWT**
- **Files:** `security/JwtService.java`, `security/JwtAuthFilter.java`, `security/CurrentUser.java` (record: id, role, username, fullName, schoolId), `security/AuthUser.java`, `security/SecurityConfig.java`, `security/AppUserDetailsService.java`.
- **Chi tiết:** stateless; permitAll cho `/api/auth/**`, `/api/payos/webhook`, `/actuator/**`, `/ws/**`; còn lại authenticated. `CurrentUser` lấy từ `SecurityContextHolder` qua `@AuthenticationPrincipal`. Helper `@CurrentUser CurrentUser user` param resolver.
- **Check:** boot OK, gọi API không token → 401 `{ "error": "Thiếu token xác thực" }`.

**Task 1.3: Object storage (MinIO)**
- **Files:** `infra/storage/StorageService.java` (+ impl), `infra/storage/MinioConfig.java`, controller `api/storage/UploadController.java` — `POST /api/uploads` (multipart `file`) → `{ "url": "...", "public_id": "..." }`.
- **Chi tiết:** URL public dạng `http://localhost:9000/kidslink/<folder>/<uuid>.<ext>`; bucket đã public-read. Giới hạn 10MB, chỉ ảnh.
- **Check:** curl upload → ảnh mở được qua trình duyệt.

**Task 1.4: WebSocket STOMP broker**
- **Files:** `ws/WebSocketConfig.java` (`@EnableWebSocketMessageBroker`, endpoint `/ws` với SockJS, broker prefix `/topic`, `/queue`, app prefix `/app`, user destination `/user`), `ws/JwtChannelInterceptor.java` (auth từ header `Authorization` trong CONNECT frame), `ws/StompPrincipal`.
- **Channels:** client SUBSCRIBE `/topic/conversations/{id}`, `/user/queue/notifications`.
- **Check:** FE test tay kết nối không lỗi 403.

### PHASE 2 — Auth & User (P2)

**Task 2.1: Auth API**
- **Files:** `api/auth/AuthController.java`, `api/auth/AuthService.java`, `api/auth/dto/*`.
- **Endpoints:** `POST /api/auth/login` `{username,password}` → `{token, user:{id,full_name,username,role,avatar_url,email,phone_number,status,school_id}}`; `POST /api/auth/register` (full_name, username, password, role, email, phone_number, avatar_url?) → 201 cùng shape; `POST /api/auth/forgot-password` `{email}`.
- **Rules:** password 8-16 ký tự có hoa/thường/số/ký tự đặc biệt; phone VN regex `^(\+84|0)(3|5|7|8|9)\d{8}$`; trùng username/email/phone → 409 với message `Username đã tồn tại` / `Email đã tồn tại` / `Số điện thoại đã tồn tại`; sai login → 401 `Sai thông tin đăng nhập`; status≠1 → 403 `Tài khoản đang bị khóa`; school status≠1 → 403 `Trường học của bạn đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên hệ thống.`
- **Admin đặc biệt:** login bằng `app.admin.username`/`password` (env ADMIN_USERNAME/ADMIN_PASSWORD) → user id `"admin"`, role `admin`, school_id null (JWT subject giả lập; JwtAuthFilter cho phép).
- **Register role:** tự tạo bản ghi `parents`/`teachers`/`health_care_staffs` rỗng tương ứng khi role cần.
- **Check:** curl login 6 user seed → 200 + token dùng được cho `/api/users/me`.

**Task 2.2: User & Profile API**
- **Files:** `api/user/UserController.java`, `UserService.java`, `dto/*`.
- **Endpoints:** `GET /api/users/me`, `PUT /api/users/me`, `PUT /api/users/change-password`; admin: `GET /api/users` (search q, role, school_id, status, page/size), `GET/POST/PUT/DELETE /api/users/:id`, `DELETE /api/users/:id/hard`, `PUT /api/users/:id/restore`.
- **Check:** GET/PUT me OK, admin list phân trang.

### PHASE 3 — Tổ chức trường học (P3)

**Task 3.1: School admin quản lý trường**
- `GET /api/admin/schools` (admin hệ thống), `GET/PUT /api/admin/schools/:id`, `POST`, `DELETE`, `PUT /:id/status`.
- `GET /api/school-admin/school` (trường của mình), `PUT /api/school-admin/school` (cập nhật thông tin + payos config). Payos config là object lồng: `{client_id, api_key, checksum_key, account_number, account_name, bank_code, active, webhook_url}` ↔ cột `payos_*`. Cần `@JsonNaming`/MapStruct thủ công (viết mapping tay).

**Task 3.2: ClassAge + Class + Student + Parent link**
- `GET/POST/PUT/DELETE /api/class-ages`
- `GET /api/classes` (filter theo teacher nếu role teacher), `GET /api/classes/:id`, `POST`, `PUT /:id`, `DELETE /:id`, `POST /:id/promote` (chuyển cả lớp lên lớp tuổi mới — xem logic trong `classController.js` của repo cũ), `GET /:classId/eligible-students`, `POST /:classId/students` (body `{student_ids: [], discount?}`), `DELETE /:classId/students/:studentId`.
- `GET /api/student/all`, `GET /api/student/class/:classId`, `GET /api/student/:id`, `POST`, `PUT /:id`, `POST /:id/transfer` (đổi lớp), `PATCH /:id/status`, `POST /:id/parents`, `DELETE /:id/parents/:parentId`, `DELETE /:id`.
- `GET /api/parentcrud` (list parent + user info + children), `POST`, `POST /link`, `PUT /:id`, `DELETE /:id`.
- **Check:** tạo lớp/student/link parent, list trả đúng shape repo cũ.

### PHASE 4 — Lịch & Thực đơn (P4)

**Task 4.1: Slot, Activity, Calendar (school admin)**
- `GET/POST /api/school-admin/calendar/slots`, `PUT/DELETE /:slotId`, `POST /slots/update-names`
- `GET/POST /api/school-admin/calendar/activities`, `PUT/DELETE /:activityId`
- `GET /api/school-admin/calendar/class/:classId`, `POST /calendar/bulk` (body `{class_id, entries:[{weekday_id, slot_id, activity_id, teacher_id, date}]}`), `POST /calendar/:calendarId`, `DELETE /calendar/:calendarId`
- `GET /api/school-admin/calendar/teachers`
- **Check:** tạo 1 tuần lịch cho lớp A1, GET trả đủ.

**Task 4.2: Teacher calendar & attendance**
- `GET /api/teachers/class`, `GET /api/teachers/class/students`, `GET /api/teachers/class/students/attendance/:date`, `GET /api/teachers/class-calendar`, `GET /api/teachers/teaching-calendar`, `GET /api/teachers/class-calendar/slots`, `GET /api/teachers/students/:id`.

**Task 4.3: Nutrition**
- `GET/POST /api/nutrition/dishes`, `PUT/DELETE /:id`; `GET /api/nutrition/class-ages`, `/classes`, `/classes/:classId/students`, `/class-ages/:classAgeId/students`, `/class-age-meals`, `/meals`, `/weekdays`, `POST /class-age-meals/assign`, `GET /class-age-meals/dishes`, `GET /class-age-meals/weekly-dishes`, `GET/PUT /profile`, `PUT /change-password`.
- **Logic `assign`:** body `{class_age_id, weekday_id, meal_id, date, dish_ids: []}` → upsert `class_age_meals` + replace `dishes_class_age_meals`.
- **Parent menu:** `GET /api/parent/menu` (theo class_age của con, tuần hiện tại).

### PHASE 5 — Học phí & Thanh toán (P5)

**Task 5.1: Fee & Invoice (school admin)**
- `GET/POST /api/school-admin/fees`, `GET/PUT/DELETE /:id`, `GET /:id/classes/:classFeeId/payments` (danh sách học sinh + trạng thái invoice), `POST /:id/classes/:classFeeId/students/:studentClassId/invoice`, `POST /:id/classes/:classFeeId/payments/:invoiceId/offline`.
- **Công thức:** `amount_due = fee.amount * (1 - studentClass.discount/100)`; late fee: `fixed` → cộng giá trị, `percentage` → `base * value/100`. Invoice quá `due_date` và status=0 → coi là overdue khi hiển thị (status db vẫn 0).

**Task 5.2: PayOS + Parent fees**
- `GET /api/parent/fees`, `GET /api/parent/fees/unpaid-count`, `POST /api/parent/fees/payos` (tạo payment link), `POST /api/parent/fees/payos/status` (poll trạng thái), `POST /api/payos/webhook` (verify signature, cập nhật invoice → paid).
- **Lưu ý:** không có credential PayOS thật → khi `payos.active=false` trả lỗi rõ ràng `Trường chưa cấu hình thanh toán online`; code vẫn implement đầy đủ request HMAC-SHA256 theo tài liệu PayOS (`checksumKey`, `signature` từ `amount|description|orderCode`).

### PHASE 6 — Mạng xã hội & Chat (P6)

**Task 6.1: Posts (parent + teacher + school admin)**
- `GET /api/{parent|teachers|school-admin}/posts` (feed: bài của lớp mình + bài chung của trường), `GET /posts/my-posts`, `POST /posts` (content, image_urls[]; status pending), `PUT /posts/:postId`, `DELETE /posts/:postId`, `POST /posts/:postId/like` (toggle), `GET /posts/:postId/likes`, `POST /posts/:postId/comments`, `GET /posts/:postId/comments` (cây lồng nhau: `parent_comment_id`), `PUT /comments/:commentId`, `DELETE /comments/:commentId`.
- School admin có thêm `PUT /posts/:postId/status` (duyệt) và xem tất cả.
- **Check:** parent tạo post → school admin approve → teacher thấy trong feed.

**Task 6.2: Messaging REST**
- `POST /api/messaging/conversations` (tạo nhóm chat lớp), `GET /conversations` (kèm unread_count, last_message), `GET /conversations/:id`, `POST /:id/participants`, `GET /:id/messages?before=&limit=`, `POST /messages` (REST fallback), `PUT /:id/read`, `GET /unread-count`, `POST /conversations/direct` (chat 1-1 parent–teacher), `GET /teachers-by-student/:studentId`, `GET /parents-by-teacher-class`, `POST /api/teachers/class/chat-group` (tạo nhóm chat lớp).

**Task 6.3: Messaging STOMP**
- `@MessageMapping` tại `/app/message.send`, `/app/message.read`, `/app/typing` → publish `/topic/conversations/{id}`.
- Message payload giữ shape: `{ id, content, image_url, send_at, read_status, conversation_id, sender: {id, full_name, avatar_url, role} }`.

### PHASE 7 — Khiếu nại, Báo cáo, Y tế, Đón trẻ (P7)

**Task 7.1: DailyReport**
- `POST /api/teachers/daily-reports/checkin`, `PUT /daily-reports/checkout`, `PUT /daily-reports/:id/comment`, `GET /students/:student_id/daily-reports/weekly`.
- `GET /api/parent/daily-reports?studentId=&from=&to=`.

**Task 7.2: Health (staff + parent view)**
- `GET /api/health-staff/classes`, `/classes/:classId/students`, `GET/POST /health/records`, `PUT/DELETE /:recordId`, `GET/POST /health/notices`, `PUT/DELETE /:noticeId`, `GET/PUT /profile`, `PUT /change-password`.
- Parent xem qua `GET /api/parent/child-info/:studentId` (gồm health records/notices/allergy/pickups).

**Task 7.3: Complaint**
- `GET /api/school-admin/complaints/stats`, `GET /`, `GET /:complaintId`, `PUT /:complaintId/approve|reject`, `GET /types/list`, `POST/PUT/DELETE /types/:typeId` (đường dẫn thực tế: `/api/school-admin/complaints/types/list`, `/types`, `/types/:typeId`).
- Teacher/Parent: `GET /api/{teachers|parent}/complaints/types`, `POST /api/{teachers|parent}/complaints`, `GET .../complaints`, `GET .../complaints/:id`.
- **Rules:** type phải có category chứa role người tạo; complaint lưu snapshot `complaint_type_name`; `image` optional.

**Task 7.4: Pickup**
- `POST /api/parent/pickups/:studentId`, `PUT /api/parent/pickups/:pickupId/:studentId`, `DELETE /api/parent/pickups/:pickupId/:studentId`.
- Pickup unique theo `id_card_number` và `phone` toàn hệ thống → nếu đã tồn tại với info trùng thì liên kết tới student, không tạo mới.

### PHASE 8 — Seed dữ liệu (P8)

**Task 8.1: Seed runner**
- **Files:** `backend/src/main/java/vn/kidslink/config/DataSeeder.java` (`ApplicationRunner`, chạy khi `app.seed.enabled=true` và bảng `users` rỗng).
- **Users:** `schooladmin`/`Admin@123`, `teacher1..teacher5`/`Teacher@123`, `parent1..parent5`/`Parent@123`, `nurse1`/`Nurse@123`, `cook1`/`Cook@123`, `admin` (env).
- **Data:** 1 trường "KidsLink Preschool", 3 ClassAge (3/4/5 tuổi), 3 lớp A1/B1/C1 (năm học 2025-2026), 6 học sinh, liên kết parent-student + student-class, 6 slot, 8 activity, lịch 1 tuần cho A1, 3 meal × 7 weekday × 3 class age menu mẫu, 5 dish, 1 fee + class fee, 3 complaint type (dùng category teacher/parent), 5 post đã duyệt + vài comment/like, 1 conversation nhóm lớp A1, 1 health record, 1 health notice, 1 pickup mỗi học sinh.
- **Check:** login 6 tài khoản, dashboard các role có dữ liệu.

### PHASE 9 — Frontend Next.js (P9)

**Task 9.1: Nền tảng FE**
- **Files:** `frontend/src/lib/api.ts` (fetch wrapper, base `NEXT_PUBLIC_API_URL` mặc định `http://localhost:8080/api`, tự gắn Bearer, xử lý 401 → logout & redirect `/login`, throw `ApiError`), `frontend/src/lib/auth-store.ts` (Zustand hoặc Context + localStorage token/user), `frontend/src/components/providers.tsx` (QueryClientProvider + AuthProvider), `frontend/src/components/ui/*` (Button, Input, Card, Table, Modal, Badge, Spinner, EmptyState, PageHeader, StatCard), `frontend/src/lib/format.ts` (tiền VND, ngày dd/MM/yyyy), `frontend/src/lib/constants.ts` (role labels tiếng Việt, status maps).
- **Check:** `npm run build` pass, trang chủ mới render được.

**Task 9.2: Layout theo role + Auth pages**
- **Files:** `src/app/(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `(auth)/forgot-password/page.tsx`, `src/app/(dashboard)/layout.tsx` (sidebar theo role + topbar + user menu), `src/components/role-guard.tsx`, `src/middleware.ts` (redirect nếu không có token ở route protected — token ở cookie để middleware thấy được, hoặc làm guard phía client; chọn client guard + `/login` redirect).
- **Routes theo role:** school_admin `/school-admin/...`, teacher `/teacher/...`, parent `/parent/...`, health_care_staff `/health-care/...`, nutrition_staff `/nutrition/...`, admin `/admin/...`.
- **Check:** login từng role vào đúng dashboard, role khác chặn 403.

**Task 9.3 – 9.8:** Mỗi màn hình nghiệp vụ 1 task, gồm API client riêng (`src/lib/services/<module>.ts`) + trang:
- 9.3 School admin: dashboard, quản lý lớp, học sinh, phụ huynh, lịch học, thực đơn, học phí, bài đăng, khiếu nại, thông tin trường.
- 9.4 Teacher: dashboard, lớp & học sinh, điểm danh, báo cáo ngày, lịch dạy, feed, khiếu nại, chat, profile.
- 9.5 Parent: dashboard, thông tin con & người đón, lịch lớp, báo cáo ngày, thực đơn, học phí + PayOS, feed, khiếu nại, chat, profile.
- 9.6 Health staff: dashboard, lớp & học sinh, hồ sơ sức khỏe, thông báo sức khỏe, profile.
- 9.7 Nutrition staff: danh sách món ăn (CRUD), lập thực đơn tuần, profile.
- 9.8 Admin hệ thống: quản lý trường, quản lý user.
- **Check mỗi task:** `npm run build` pass; chạy app, đăng nhập role tương ứng, thao tác chính thành công (không lỗi console/network 4xx–5xx).

### PHASE 10 — Hoàn tất (P10)

- **10.1 README + `.env.example`** ở root, `backend/`, `frontend/`; hướng dẫn `docker compose up`, seed, tài khoản demo.
- **10.2 Kiểm thử end-to-end** toàn bộ luồng chính từng role.
- **10.3 Đóng gói:** tạo `docker/Dockerfile` backend + frontend (optional), commit, push lên GitHub (`SEP490-G62/kidslink` — xin xác nhận remote/credential trước khi push).

---

## Quy tắc cho subagent khi thực thi

1. Đọc plan này trước, chỉ làm đúng task được giao, KHÔNG làm task khác.
2. Mỗi task xong phải qua `Check` ghi trong task. Nếu check fail → sửa hoặc báo BLOCKED.
3. Commit theo format Conventional Commits, message tiếng Anh, scope theo module:
   `feat(backend): add fee and invoice APIs`, `feat(frontend): add parent fee payment screen`.
4. Không commit file `.env`, `node_modules`, `target`, `.next`.
5. Nếu cần đọc logic cũ: `%TEMP%\kidslink-src\back-end\src` (đã clone) — KHÔNG clone lại.
6. Khi bị lỗi môi trường (port, docker, build) → report BLOCKED kèm lỗi nguyên văn, không tự ý đổi hạ tầng.
7. Cuối task, báo cáo: files đã tạo/sửa, check đã chạy + kết quả, ảnh hưởng tới task phía sau.

---

## Phân bổ model cho subagent (cập nhật)

Quota `anthropic/claude-opus-5-5` đã cạn. Phân bổ theo độ khó:

| Wave | Task | Model | Lý do |
|---|---|---|---|
| 1 | 0.x schema + entity | `opencode-go/glm-5.3` | nền tảng, nhiều file nhưng mô tả DDL đã có sẵn; cần model mạnh để khớp validate |
| 2 | 1.x nền tảng (JWT/MinIO/STOMP) | `opencode-go/qwen4-max` | logic khó, nhiều API mới của Spring |
| 3 | 2.x auth/user + 3.x school/class/student | `opencode-go/mimo-v2.6-pro` | nghiệp vụ chính, nhiều endpoint |
| 3 | 4.x calendar + nutrition | `opencode-go/qwen3.8-max` | bulk upsert, menu tuần |
| 3 | 5.x fees + PayOS | `opencode-go/qwen3.8-max` | BigDecimal, HMAC |
| 3 | 6.x posts + messaging | `opencode-go/mimo-v2.6-pro` | cây comment, STOMP |
| 3 | 7.x report/health/complaint/pickup | `opencode-go/mimo-v2.6-flash` | CRUD đơn giản |
| 4 | 8.x seed | `opencode-go/deepseek-v4.1-flash` | sinh dữ liệu, không phức tạp |
| 5 | 9.x frontend | `opencode-go/qwen4-max` + `mimo-v2.6-pro` | UI nhiều màn hình, cần model tốt |
| 6 | 10.x docs + E2E | `opencode-go/deepseek-v4.1-flash` | viết tài liệu |

Quy tắc: wave phụ thuộc chỉ chạy sau khi wave trước commit xong và verify pass.
