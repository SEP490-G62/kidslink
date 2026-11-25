# KidsLink

KidsLink là nền tảng kết nối nhà trường mầm non, giáo viên và phụ huynh. Hệ thống hỗ trợ quản lý trường, lớp và học sinh; lịch học, điểm danh, báo cáo hằng ngày; thực đơn, sức khỏe, đưa đón; bài đăng, trò chuyện, khiếu nại; học phí và thanh toán trực tuyến qua PayOS.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Backend | Spring Boot 4.1.3, Java 21, Spring Security/JWT, Spring Data JPA, Flyway |
| Frontend | Next.js 16.4.6 (App Router), React 19, TypeScript, Tailwind CSS 4, TanStack Query |
| Cơ sở dữ liệu | PostgreSQL 16 |
| Lưu trữ tệp | MinIO (S3-compatible) |
| Thời gian thực | WebSocket, SockJS và STOMP |
| Hạ tầng local | Docker Compose |

## Cấu trúc thư mục

```text
kidslink/
├── backend/                 # Spring Boot API, Flyway migration và seed dữ liệu
│   ├── src/main/java/       # Mã nguồn Java theo package vn.kidslink
│   ├── src/main/resources/  # application.yml và db/migration
│   ├── mvnw                 # Maven Wrapper cho bash
│   └── mvnw.cmd             # Maven Wrapper cho Windows
├── frontend/                # Next.js App Router
│   ├── src/app/             # Route công khai, xác thực và dashboard theo role
│   ├── src/components/      # Component dùng chung và component theo nghiệp vụ
│   └── src/lib/             # API client, service, type và tiện ích
├── infra/
│   ├── docker-compose.yml   # PostgreSQL và MinIO
│   └── .env.example         # Cấu hình hạ tầng mẫu
└── tasks/                   # Kế hoạch và ghi chú triển khai
```

Tài liệu chuyên sâu: [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md), [infra/README.md](infra/README.md).

## Chạy dự án từ đầu

### Yêu cầu

- JDK 21 trở lên; kiểm tra bằng `java -version`.
- Node.js 22 trở lên và npm; kiểm tra bằng `node -v`, `npm -v`.
- Docker Desktop với Docker Compose; kiểm tra bằng `docker compose version`.
- Git.

Các lệnh bên dưới chạy từ thư mục gốc `kidslink/`, trừ khi có ghi chú khác. Nếu chưa có mã nguồn:

```bash
git clone https://github.com/SEP490-G62/kidslink.git
cd kidslink
```

### Bước 1: Khởi động PostgreSQL và MinIO

Mở Docker Desktop, sau đó chạy:

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

Chờ cả `postgres` và `minio` đạt trạng thái `healthy`. Cấu hình mặc định:

| Tài nguyên | Địa chỉ/thông tin |
| --- | --- |
| PostgreSQL | `localhost:5439`, database/user/password: `kidslink`/`kidslink`/`kidslink` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001`, user/password: `kidslink`/`kidslink123` |
| MinIO bucket | `kidslink`, cho phép tải object công khai |

Không cần tạo database hoặc bucket thủ công. Xem [infra/README.md](infra/README.md) nếu muốn đổi cổng, xem log hoặc reset dữ liệu.

### Bước 2: Khởi động backend

Mở một terminal mới tại thư mục gốc dự án.

**Git Bash/bash trên Windows:**

```bash
cd backend
sh mvnw spring-boot:run
```

**PowerShell:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Ở lần chạy đầu, Maven Wrapper tải dependency, Flyway tạo schema và seed dữ liệu demo nếu database chưa có user. Backend mặc định lắng nghe cổng **8080**. Giữ terminal này chạy trong quá trình phát triển.

Để đổi sang cổng **18080**:

```bash
# bash, từ thư mục backend/
SERVER_PORT=18080 sh mvnw spring-boot:run
```

```powershell
# PowerShell, từ thư mục backend/
$env:SERVER_PORT = "18080"
.\mvnw.cmd spring-boot:run
```

Nếu đổi cổng backend, cập nhật cả `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_WS_URL` của frontend như hướng dẫn ở bước 3.

### Bước 3: Khởi động frontend

Mở thêm một terminal tại thư mục gốc dự án:

```bash
cd frontend
npm install
npm run dev
```

Hai lệnh trên chạy được trong cả bash và PowerShell. Frontend mặc định chạy tại **http://localhost:3000**.

Frontend dùng sẵn giá trị mặc định cho backend cổng 8080. Khi backend chạy cổng 18080, tạo `frontend/.env.local` với nội dung:

```env
NEXT_PUBLIC_API_URL=http://localhost:18080/api
NEXT_PUBLIC_WS_URL=http://localhost:18080/ws
```

Khởi động lại `npm run dev` sau khi thay đổi biến môi trường.

### Bước 4: Truy cập và kiểm tra

- Ứng dụng: [http://localhost:3000](http://localhost:3000).
- API base: [http://localhost:8080/api](http://localhost:8080/api), hoặc `http://localhost:18080/api` nếu đã đổi cổng.
- Actuator health: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health), hoặc `/actuator/health` trên cổng đã đổi.
- WebSocket endpoint: `http://localhost:8080/ws` (SockJS + STOMP).

## Tài khoản demo

| Username | Password | Vai trò | Trang sau đăng nhập |
| --- | --- | --- | --- |
| `superadmin` | `Admin@123` | Quản trị hệ thống | `/admin` |
| `schooladmin` | `Admin@123` | Quản trị trường | `/school-admin` |
| `teacher1` | `Teacher@123` | Giáo viên | `/teacher` |
| `teacher2` | `Teacher@123` | Giáo viên | `/teacher` |
| `parent1` | `Parent@123` | Phụ huynh | `/parent` |
| `parent2` | `Parent@123` | Phụ huynh | `/parent` |
| `nurse1` | `Nurse@123` | Nhân viên y tế | `/health-care` |
| `cook1` | `Cook@123` | Nhân viên dinh dưỡng | `/nutrition` |

Tám tài khoản đều là user thật trong database, được tạo bởi seed. Tài khoản `superadmin` có vai trò `admin` (không gắn trường). Chỉ dùng các tài khoản và secret mặc định cho môi trường phát triển.

## Kiểm thử smoke

Hai script kiểm thử nhanh, chạy sau khi backend (cổng 18080) và frontend (cổng 3001) đã lên:

```bash
# bash, từ thư mục gốc repo
bash scripts/smoke-test.sh            # 53 test API cho cả 6 role
bash scripts/smoke-test-frontend.sh   # 45 route frontend phải trả 200
```

Đổi cổng bằng biến môi trường:

```bash
BASE=http://localhost:8080/api bash scripts/smoke-test.sh
FE=http://localhost:3000 bash scripts/smoke-test-frontend.sh
```

Kết quả mong đợi: `PASS=53 FAIL=0` và `PASS=45 FAIL=0`.

## Seed dữ liệu

Seed được bật mặc định qua `app.seed.enabled=true` và chỉ chạy khi bảng user trống. Nếu database đã có user, backend ghi log bỏ qua seed và giữ nguyên dữ liệu.

Tắt seed khi khởi động backend:

```bash
# bash, từ thư mục backend/
SEED_ENABLED=false sh mvnw spring-boot:run
```

```powershell
# PowerShell, từ thư mục backend/
$env:SEED_ENABLED = "false"
.\mvnw.cmd spring-boot:run
```

Để seed lại dữ liệu demo cho môi trường local, reset volume theo [infra/README.md](infra/README.md#reset-dữ-liệu-local), khởi động lại PostgreSQL/MinIO rồi chạy backend. Thao tác reset xóa toàn bộ dữ liệu local.

## Build production

**Backend:**

```bash
# bash, từ thư mục backend/
sh mvnw -q -DskipTests package
```

```powershell
# PowerShell, từ thư mục backend/
.\mvnw.cmd -q -DskipTests package
```

File JAR được tạo tại `backend/target/kidslink-api-1.0.0.jar`. Chạy JAR bằng `java -jar target/kidslink-api-1.0.0.jar` từ thư mục `backend/`.

**Frontend:**

```bash
# Từ thư mục frontend/, dùng được trong bash và PowerShell
npm run build
npm run start
```

`npm run start` phục vụ bản production build; `npm run dev` dùng cho phát triển. Khi build/deploy production, cấu hình đầy đủ biến môi trường backend và hai biến `NEXT_PUBLIC_*` của frontend thay vì dùng giá trị local mặc định.

## Route frontend

Mã nguồn hiện có **45 file `page.tsx`**: 41 route dashboard thuộc sáu role và bốn route chung (`/`, `/login`, `/register`, `/forgot-password`). Route group `(auth)` và `(dashboard)` không xuất hiện trong URL.

| Vai trò | Các route |
| --- | --- |
| Quản trị hệ thống | `/admin`, `/admin/schools`, `/admin/users` |
| Quản trị trường | `/school-admin`, `/school-admin/classes`, `/school-admin/students`, `/school-admin/parents`, `/school-admin/calendar`, `/school-admin/menu`, `/school-admin/fees`, `/school-admin/posts`, `/school-admin/complaints`, `/school-admin/school` |
| Giáo viên | `/teacher`, `/teacher/class`, `/teacher/attendance`, `/teacher/daily-reports`, `/teacher/calendar`, `/teacher/posts`, `/teacher/chat`, `/teacher/complaints`, `/teacher/profile` |
| Phụ huynh | `/parent`, `/parent/children`, `/parent/calendar`, `/parent/daily-reports`, `/parent/menu`, `/parent/fees`, `/parent/posts`, `/parent/chat`, `/parent/complaints`, `/parent/profile` |
| Nhân viên y tế | `/health-care`, `/health-care/classes`, `/health-care/records`, `/health-care/notices`, `/health-care/profile` |
| Nhân viên dinh dưỡng | `/nutrition`, `/nutrition/dishes`, `/nutrition/menu`, `/nutrition/profile` |

Các route công khai/xác thực: `/` (giới thiệu), `/login`, `/register`, `/forgot-password`. Layout của từng role áp dụng `RoleGuard`, sidebar và điều hướng tương ứng.

## Cấu hình PayOS

1. Đăng nhập bằng tài khoản quản trị trường (`schooladmin`).
2. Mở **Trường học** (`/school-admin/school`, màn thông tin trường).
3. Trong **Cấu hình PayOS**, bật **Bật thanh toán trực tuyến**.
4. Điền **Client ID**, **API Key**, **Checksum Key** (`client_id`, `api_key`, `checksum_key`) cùng thông tin tài khoản/ngân hàng nhận tiền.
5. Chọn **Lưu thay đổi**.

Khi PayOS chưa được bật, phụ huynh chỉ có phương án thanh toán trực tiếp tại trường. `PAYOS_WEBHOOK_BASE_URL` ở backend phải trỏ tới địa chỉ backend phù hợp với môi trường triển khai webhook.
