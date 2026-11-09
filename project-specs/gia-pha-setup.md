# Gia phả — hệ thống 3 tầng

Phạm vi bám spec Excel và ứng dụng tĩnh hiện có. Không làm phục chế ảnh, tử vi, thanh toán, hay bản sao thương hiệu bên ngoài.

## Tầng

1. Frontend: React + Vite + TypeScript + Ant Design, thư mục `frontend/`.
2. Backend: Rust (Axum, SQLx), thư mục `backend/`, xếp theo DDD.
3. Dữ liệu: PostgreSQL 16, Docker Compose trong `deploy/`.

Ứng dụng tĩnh ở gốc (`index.html`, `js/`, `css/`) là bản phả đồ cũ, tách khỏi sản phẩm.

### Frontend

- `src/domain`: mô hình người, họ, xưng hô và cách dựng cây.
- `src/application`: phiên đăng nhập.
- `src/infrastructure`: gọi HTTP tới backend.
- `src/presentation`: trang và bố cục.

### Backend

Phụ thuộc đi một chiều: interface → application → domain ← infrastructure.

- `src/domain`: thực thể, quy tắc xưng hô, cổng repository. Không có SQL hay HTTP.
- `src/application`: ca sử dụng đăng ký, đăng nhập, phả đồ, tin tức, sự kiện.
- `src/infrastructure`: PostgreSQL, argon2, JWT, seed.
- `src/interfaces/http`: Axum, chỉ đổi request/response.
- `src/main.rs`: composition root, nối các lớp.

## Chức năng đi cùng phả đồ

Các phần mềm gia phả cùng loại đều có các khối này bên cạnh cây:

- Tài khoản: đăng ký, đăng nhập, hồ sơ, vai trò `member` | `editor` | `admin`.
- Dòng họ và thành viên lấy từ cơ sở dữ liệu, không hard-code trên giao diện.
- Phả đồ mẫu phụ hệ (P01–P19) và liên họ Nguyễn–Dương (N/D).
- Xưng hô: gọi `POST /api/kinship`, giữ đúng thuật toán trong `js/kinship.js` và `js/lienho.js`.
- Tin tức dòng họ: khách xem, `editor` và `admin` tạo.
- Sự kiện (giỗ, họp họ): khách xem, `editor` và `admin` tạo.
- Quy tắc a/b của phả đồ mẫu: đọc từ dữ liệu đã có.

## Hợp đồng API

Tiền tố không có `/api` trên tiến trình Rust. Cổng 8080. Web nginx chuyển `/api` vào dịch vụ này và bỏ tiền tố.

- `GET /health` → `{ "ok": true }`
- `POST /auth/register` `{ email, password, name }` → `{ token, user }`
- `POST /auth/login` `{ email, password }` → `{ token, user }`
- `GET /auth/me` Bearer
- `PATCH /auth/me` `{ name }` Bearer
- `GET /clans`
- `GET /people?clan={id}`
- `POST /kinship` `{ fromId, toId, region, graph, prefer }`
- `GET /news` và `POST /news` `{ title, body }`
- `GET /events` và `POST /events` `{ title, kind, eventDate, place, body }`
- `GET /rules?a=&b=`

`user`: `{ id, email, name, role }`. Lỗi: `{ "error": "..." }` với mã 4xx.

`graph` là `mau` hoặc `lien`. `region` là `bac`, `trung`, `nam`. `prefer` là `gan`, `noi`, `ngoai`.

Khi khởi động, nếu chưa có dữ liệu thì nạp `backend/assets/*.json` và tạo `admin@giapha.local` / `Admin@12345` vai trò admin.

## Kiểm thử bắt buộc

- `cargo test` cho xưng hô mẫu phải khớp `mau-tests.json` (12 ca) và các ca liên họ của Nguyễn Văn Minh đã chốt trong `js/lienho.js` (`runChecks`).
- Sau `docker compose up`, gọi được health, login, people, kinship, news.
