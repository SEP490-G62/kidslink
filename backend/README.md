# KidsLink Backend

API Spring Boot 4.1.3 trên Java 21, dùng PostgreSQL 16, Flyway, Spring Security/JWT, MinIO và STOMP WebSocket. Toàn bộ cấu hình mặc định nằm ở `src/main/resources/application.yml`.

## Chạy và build

Từ thư mục `backend/`:

```bash
# bash
sh mvnw spring-boot:run
sh mvnw -q -DskipTests package
```

```powershell
# PowerShell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd -q -DskipTests package
```

API mặc định tại `http://localhost:8080/api`; health check tại `http://localhost:8080/actuator/health`. PostgreSQL và MinIO phải được khởi động trước bằng `docker compose -f infra/docker-compose.yml up -d` từ thư mục gốc repo.

## Cấu trúc package

```text
src/main/java/vn/kidslink/
├── KidslinkApiApplication.java
├── api/                         # Controller, service và DTO theo module nghiệp vụ
│   ├── auth/                    # Đăng nhập, đăng ký, quên mật khẩu
│   ├── user/                    # Quản lý người dùng
│   ├── org/                     # Lớp, học sinh, phụ huynh, nhóm tuổi
│   ├── school/                  # Thông tin trường và quản trị trường
│   ├── calendar/                # Lịch học/lịch dạy
│   ├── nutrition/               # Món ăn và thực đơn
│   ├── fee/                     # Học phí, PayOS và webhook
│   ├── post/                    # Bài đăng/bảng tin
│   ├── messaging/               # Hội thoại và tin nhắn
│   ├── complaint/               # Khiếu nại
│   ├── report/                  # Báo cáo hằng ngày
│   ├── health/                  # Hồ sơ và thông báo sức khỏe
│   ├── pickup/                  # Thông tin đưa đón
│   └── storage/                 # Upload tệp
├── domain/
│   ├── entity/                  # JPA entity; BaseEntity chứa id/created_at/updated_at
│   ├── repository/              # Spring Data JPA repository
│   └── Role.java                # Vai trò hệ thống
├── security/                    # JWT, SecurityConfig, CurrentUser
├── config/                      # DataSeeder, SeedSupport, RestClientConfig
├── common/                      # ApiError, exception và GlobalExceptionHandler
├── infra/storage/               # Tích hợp lưu trữ MinIO/S3
└── ws/                          # Cấu hình STOMP và xác thực kênh WebSocket

src/main/resources/
├── application.yml
└── db/migration/                # Flyway SQL migration, hiện bắt đầu từ V1__init_schema.sql
```

Một module trong `api/` có thể gồm nhiều controller theo role nhưng dùng chung service/DTO, ví dụ `post/`, `messaging/`, `fee/`. Không tạo thêm tầng package song song nếu có thể đặt code vào các package trên.

## Thêm module mới

1. **Tạo migration nếu thay đổi schema.** Thêm `src/main/resources/db/migration/V<số_tiếp_theo>__<mo_ta>.sql`. Không sửa migration đã được áp dụng. `spring.jpa.hibernate.ddl-auto=validate`, nên entity và schema phải khớp nhau khi ứng dụng khởi động.
2. **Khai báo domain.** Thêm entity vào `domain/entity`, kế thừa `BaseEntity` khi phù hợp; thêm repository vào `domain/repository` bằng cách mở rộng `JpaRepository`. Giữ kiểu khóa chính `UUID` theo các entity hiện có.
3. **Tạo package nghiệp vụ.** Đặt DTO, service và controller trong `api/<module>/`. Dùng constructor injection, `@Service` cho nghiệp vụ, `@Transactional` ở giao dịch phù hợp, `@RestController` và `@RequestMapping("/api/...")` cho endpoint.
4. **Validate và phân quyền.** Dùng `@Valid` cho request cần kiểm tra, các exception trong `common/` cho lỗi nghiệp vụ, `@PreAuthorize` và/hoặc `CurrentUser` theo quyền của endpoint. Mọi endpoint ngoài danh sách public trong `SecurityConfig` mặc định yêu cầu JWT; chỉ sửa `SecurityConfig` nếu endpoint thật sự cần public.
5. **Map dữ liệu.** Backend cấu hình Jackson `SNAKE_CASE`: thuộc tính Java `fullName` được trả/nhận JSON là `full_name`. Frontend service phải dùng cùng hợp đồng này.
6. **Bổ sung dữ liệu demo khi cần.** Mở rộng `DataSeeder`/`SeedSupport` nếu module cần dữ liệu mẫu. Seed chỉ chạy khi được bật và chưa có user; không dùng seed để migrate dữ liệu thật.
7. **Kiểm tra khi khởi động.** Flyway chạy trước ứng dụng; kiểm tra migration, quyền truy cập và `/actuator/health` sau khi thay đổi.

## Biến môi trường

Giá trị dưới đây là mặc định trong `application.yml`, dùng cho local development. Có thể đặt biến môi trường trực tiếp trước lệnh `mvnw`; không cần sửa file cấu hình.

| Biến | Mặc định | Mục đích |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | Cổng HTTP backend |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5439` | Cổng PostgreSQL trên máy host |
| `DB_NAME` | `kidslink` | Tên database |
| `DB_USER` | `kidslink` | User database |
| `DB_PASSWORD` | `kidslink` | Mật khẩu database |
| `JWT_SECRET` | Secret dev trong `application.yml` | Khóa ký JWT; bắt buộc thay bằng secret mạnh ngoài môi trường dev |
| `JWT_TTL` | `24h` | Thời hạn access token |
| `ADMIN_USERNAME` | `superadmin` | Username quản trị hệ thống |
| `ADMIN_PASSWORD` | `Admin@123` | Mật khẩu quản trị hệ thống mặc định |
| `SEED_ENABLED` | `true` | Bật/tắt seed dữ liệu demo khi database trống |
| `MINIO_ENDPOINT` | `http://localhost:9000` | Endpoint backend dùng để gọi MinIO |
| `MINIO_PUBLIC_ENDPOINT` | `http://localhost:9000` | Endpoint public dùng khi tạo URL object |
| `MINIO_ACCESS_KEY` | `kidslink` | Access key MinIO |
| `MINIO_SECRET_KEY` | `kidslink123` | Secret key MinIO |
| `MINIO_BUCKET` | `kidslink` | Bucket lưu tệp |
| `MINIO_REGION` | `us-east-1` | Region S3/MinIO |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `MAIL_PORT` | `587` | SMTP port, STARTTLS được bật |
| `MAIL_USERNAME` | Trống | Tài khoản SMTP |
| `MAIL_PASSWORD` | Trống | Mật khẩu/app password SMTP |
| `MAIL_FROM` | `no-reply@kidslink.vn` | Địa chỉ người gửi |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Origin frontend được phép, phân tách bằng dấu phẩy |
| `PAYOS_WEBHOOK_BASE_URL` | `http://localhost:8080` | Base URL backend dùng cho webhook PayOS |
| `LOG_LEVEL` | `INFO` | Log level cho package `vn.kidslink` |

Ví dụ đổi cổng và tắt seed:

```bash
# bash
SERVER_PORT=18080 SEED_ENABLED=false sh mvnw spring-boot:run
```

```powershell
# PowerShell
$env:SERVER_PORT = "18080"
$env:SEED_ENABLED = "false"
.\mvnw.cmd spring-boot:run
```

Nếu đổi `SERVER_PORT`, cập nhật `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` và, khi dùng PayOS, `PAYOS_WEBHOOK_BASE_URL` cho phù hợp. Chức năng quên mật khẩu cần cấu hình `MAIL_*` hợp lệ.

## Lưu ý vận hành

- Không dùng secret, mật khẩu demo hoặc `ddl-auto=validate` như một phương án thay thế cho migration khi triển khai production.
- Volume Docker giữ dữ liệu PostgreSQL/MinIO giữa các lần `docker compose down`. Chỉ dùng `down -v` khi muốn xóa dữ liệu local.
- Upload bị giới hạn 20 MB/tệp và 60 MB/request theo cấu hình mặc định.
- Actuator chỉ expose `health` và `info` qua web ở cấu hình hiện tại.
