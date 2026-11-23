# KidsLink — Task List

Nguồn: `tasks/plan.md`. Đánh dấu `[x]` khi task xong và đã kiểm tra.

## Phase 0 — Schema & Entity
- [x] 0.1 Flyway migration 38 bảng — `backend/src/main/resources/db/migration/V1__init_schema.sql`
- [x] 0.2 JPA entities + repositories — `backend/src/main/java/vn/kidslink/domain/`

## Phase 1 — Nền tảng Backend
- [ ] 1.1 Common web layer (global exception handler, API error)
- [ ] 1.2 Security + JWT (JwtService, filter, SecurityConfig)
- [ ] 1.3 Object storage MinIO + upload API
- [ ] 1.4 WebSocket STOMP broker + JWT handshake

## Phase 2 — Auth & User
- [ ] 2.1 Auth API (login/register/forgot-password)
- [ ] 2.2 User & Profile API

## Phase 3 — Tổ chức trường học
- [ ] 3.1 School admin / admin hệ thống quản lý trường
- [ ] 3.2 ClassAge + Class + Student + Parent

## Phase 4 — Lịch & Thực đơn
- [ ] 4.1 Slot, Activity, Calendar (school admin)
- [ ] 4.2 Teacher calendar & attendance
- [ ] 4.3 Nutrition (dish, meal, weekly menu) + parent menu

## Phase 5 — Học phí & Thanh toán
- [ ] 5.1 Fee & Invoice (school admin)
- [ ] 5.2 PayOS + Parent fees

## Phase 6 — Mạng xã hội & Chat
- [ ] 6.1 Posts (feed, like, comment)
- [ ] 6.2 Messaging REST
- [ ] 6.3 Messaging STOMP

## Phase 7 — Báo cáo, Y tế, Khiếu nại, Đón trẻ
- [ ] 7.1 DailyReport
- [ ] 7.2 Health records & notices
- [ ] 7.3 Complaint & ComplaintType
- [ ] 7.4 Pickup

## Phase 8 — Seed dữ liệu
- [ ] 8.1 DataSeeder (users, school, classes, students, menus, posts, fees)

## Phase 9 — Frontend Next.js
- [ ] 9.1 Nền tảng FE (api client, auth store, UI kit)
- [ ] 9.2 Layout theo role + Auth pages
- [ ] 9.3 School admin screens
- [ ] 9.4 Teacher screens
- [ ] 9.5 Parent screens
- [ ] 9.6 Health staff screens
- [ ] 9.7 Nutrition staff screens
- [ ] 9.8 System admin screens

## Phase 10 — Hoàn tất
- [ ] 10.1 README + .env.example
- [ ] 10.2 Kiểm thử end-to-end
- [ ] 10.3 Dockerfile, commit, push GitHub

## Checkpoints
- [ ] **Sau Phase 1:** backend boot được, `/actuator/health` = UP
- [ ] **Sau Phase 2:** login 6 role thành công
- [ ] **Sau Phase 8:** seed đủ dữ liệu demo, mọi API list trả có data
- [ ] **Sau Phase 9:** mọi màn hình chạy không lỗi, `npm run build` pass
- [ ] **Kết thúc:** toàn bộ luồng chính chạy end-to-end
