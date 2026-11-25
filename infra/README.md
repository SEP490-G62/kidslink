# KidsLink Infrastructure

`docker-compose.yml` cung cấp hai service cho môi trường local: PostgreSQL và MinIO. Backend/frontend chạy trực tiếp trên máy, không nằm trong Compose file này.

## Service

| Service | Image | Kết nối từ máy host | Volume |
| --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `localhost:5439`; database/user/password mặc định `kidslink`/`kidslink`/`kidslink` | `kidslink-pgdata` |
| `minio` | `bitnamilegacy/minio:latest` | API `http://localhost:9000`; console `http://localhost:9001`; user/password `kidslink`/`kidslink123` | `kidslink-minio` |

MinIO tự tạo bucket `kidslink` với quyền tải object công khai (`download`). Container PostgreSQL lắng nghe cổng 5432 bên trong và map sang cổng 5439 trên host để tránh xung đột với PostgreSQL cài sẵn.

Cả hai service có health check và chính sách `restart: unless-stopped`.

## Cấu hình tùy chọn

Compose có giá trị mặc định cho toàn bộ biến nên có thể chạy ngay không cần file `.env`. Nếu cần đổi cổng hoặc tài khoản local, tạo `infra/.env` từ mẫu:

```bash
# bash, từ thư mục gốc repo
cp infra/.env.example infra/.env
```

```powershell
# PowerShell, từ thư mục gốc repo
Copy-Item infra/.env.example infra/.env
```

Các biến trong mẫu:

| Nhóm | Biến |
| --- | --- |
| PostgreSQL | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` |
| MinIO | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_BUCKET` |

Nếu đổi các giá trị này, cập nhật biến `DB_*`/`MINIO_*` tương ứng của backend. Đổi username/password PostgreSQL cho volume đã khởi tạo không tự cập nhật tài khoản bên trong database; cân nhắc dùng volume mới hoặc reset dữ liệu local.

## Lệnh thường dùng

Tất cả lệnh dưới đây chạy từ **thư mục gốc repo** và dùng được trong cả bash lẫn PowerShell.

### Khởi động

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

Chờ cột trạng thái của cả hai service báo `healthy` trước khi chạy backend.

### Xem trạng thái và log

```bash
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml logs
docker compose -f infra/docker-compose.yml logs -f
docker compose -f infra/docker-compose.yml logs -f postgres minio
```

Nhấn `Ctrl+C` để thoát chế độ `logs -f`; container vẫn tiếp tục chạy.

### Dừng service

```bash
docker compose -f infra/docker-compose.yml down
```

`down` xóa container/network nhưng giữ volume, nên database và object vẫn còn ở lần `up -d` tiếp theo.

## Reset dữ liệu local

> Cảnh báo: lệnh sau xóa vĩnh viễn cả volume PostgreSQL và MinIO, bao gồm toàn bộ dữ liệu demo/thay đổi local và tệp đã upload.

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

Sau khi cả hai service `healthy`, khởi động lại backend. Flyway tạo lại schema; nếu `SEED_ENABLED=true` và chưa có user, seed tạo lại dữ liệu demo cùng các tài khoản mặc định.

## Địa chỉ sử dụng

- Backend datasource: `jdbc:postgresql://localhost:5439/kidslink`.
- Backend MinIO endpoint/public endpoint: `http://localhost:9000`.
- MinIO Console: [http://localhost:9001](http://localhost:9001).
- Bucket mặc định: `kidslink`.

Không dùng tài khoản mặc định này cho môi trường public/production.
