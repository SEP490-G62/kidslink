# KidsLink Frontend

Frontend Next.js 16.4.6 dùng App Router, React 19, TypeScript, Tailwind CSS 4 và TanStack Query. Ứng dụng có sáu khu vực dashboard theo role, dùng chung API client và cơ chế xác thực JWT với Spring Boot backend.

## Chạy local

Yêu cầu Node.js 22 trở lên. Khởi động PostgreSQL/MinIO và backend trước theo [README gốc](../README.md), sau đó từ thư mục `frontend/`:

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). API mặc định là `http://localhost:8080/api` nên không cần tạo file môi trường cho cấu hình mặc định.

Các script:

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Next.js development server |
| `npm run build` | Tạo production build |
| `npm run start` | Chạy production server từ bản build |
| `npm run lint` | Chạy ESLint |

## Cấu trúc thư mục

```text
src/
├── app/
│   ├── layout.tsx             # Root layout, font, global provider
│   ├── page.tsx               # Landing page tại /
│   ├── globals.css            # Tailwind và style toàn cục
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   └── (dashboard)/
│       ├── admin/             # /admin, /admin/users, /admin/schools
│       ├── school-admin/      # /school-admin/*
│       ├── teacher/           # /teacher/*
│       ├── parent/            # /parent/*
│       ├── health-care/       # /health-care/*
│       └── nutrition/         # /nutrition/*
├── components/
│   ├── dashboard/             # DashboardShell, RoleGuard, ROLE_NAV
│   ├── ui/                    # Button, form, bảng, modal, feedback, card
│   ├── chat/                  # Component trò chuyện
│   ├── complaints/            # Component khiếu nại
│   ├── feed/                  # Bài đăng/bảng tin
│   ├── health/                # Component sức khỏe
│   ├── profile/               # Hồ sơ người dùng
│   └── providers.tsx          # AuthContext và QueryClientProvider
└── lib/
    ├── api.ts                 # API client, token, upload, ApiError
    ├── auth-store.ts          # AuthContext và hook dùng phiên đăng nhập
    ├── services/              # Hàm gọi API theo miền nghiệp vụ
    ├── types.ts               # Kiểu dữ liệu dùng chung
    ├── constants.ts           # Role, nhãn trạng thái, ROLE_HOME/ROLE_PREFIX
    ├── format.ts              # Hàm định dạng hiển thị
    └── teacher.ts             # Hàm nghiệp vụ giáo viên
```

Alias `@/*` trỏ tới `src/*`, ví dụ `@/lib/api`. Route group `(auth)` và `(dashboard)` chỉ nhóm file/layout, không nằm trong URL.

Mỗi thư mục role trong `(dashboard)` có `layout.tsx` bọc `RoleGuard` và `DashboardShell`. `components/dashboard/nav.ts` khai báo `ROLE_NAV`, là nơi thêm mục sidebar cho role đã có.

## Thêm trang mới

Ví dụ thêm `/school-admin/example`:

1. Tạo `src/app/(dashboard)/school-admin/example/page.tsx`. URL không chứa `(dashboard)`.
2. Nếu trang dùng hook, TanStack Query, state hoặc event trên trình duyệt, thêm `"use client"` ở dòng đầu. Dùng component trong `@/components/ui` và các component nghiệp vụ hiện có trước khi tạo component mới.
3. Thêm đường dẫn và label vào mảng `school_admin` trong `src/components/dashboard/nav.ts` để hiển thị trên sidebar. Layout role hiện có tự áp dụng guard; không tạo guard riêng cho từng trang.
4. Khai báo kiểu request/response cần dùng chung trong `src/lib/types.ts`; thêm hàm gọi endpoint vào file phù hợp trong `src/lib/services/` thay vì gọi `fetch` trực tiếp trong page.
5. Dùng `useQuery` để đọc dữ liệu và `useMutation` để thay đổi dữ liệu; invalidate query liên quan sau mutation thành công.

Ví dụ theo đúng module lớp học hiện có:

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteClass, listClasses } from "@/lib/services/school";
import { Loading } from "@/components/ui/feedback";

export default function ExampleClassesPage() {
  const queryClient = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const removeClass = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  if (classes.isLoading) return <Loading />;

  return (
    <ul>
      {(classes.data ?? []).map((item) => (
        <li key={item.id}>
          {item.class_name}
          <button onClick={() => removeClass.mutate(item.id)}>Xóa</button>
        </li>
      ))}
    </ul>
  );
}
```

Đây là ví dụ tối thiểu về data flow; màn hình thật cần hiển thị lỗi và xác nhận thao tác xóa như `school-admin/classes/page.tsx`.

## Quy ước API client

Dùng `api` từ `src/lib/api.ts` thông qua service:

```ts
import { api } from "@/lib/api";

export function getMyExample(id: string) {
  return api.get<MyExample>(`/example/${id}`);
}
```

- `NEXT_PUBLIC_API_URL` đã chứa `/api`; path truyền vào client chỉ bắt đầu bằng `/...`, không lặp lại `/api`.
- Các hàm có sẵn: `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.patch<T>`, `api.delete<T>`. Truyền kiểu generic cho response.
- Client tự gắn `Authorization: Bearer <token>` từ localStorage. Khi nhận 401, client xóa phiên và điều hướng về `/login`.
- Bắt lỗi bằng `ApiError`; `error`/`message` là thông điệp chung, `errors` chứa lỗi validation theo field khi backend trả về.
- Backend serialize JSON `snake_case`, nên type và payload frontend dùng `class_name`, `school_id`, ... thay vì tự đổi sang `camelCase`.
- Dùng `queryString(params)` cho query parameters. Dùng `uploadFile(file)` hoặc `uploadFiles(files)` cho upload multipart; không tự đặt `Content-Type` multipart.
- Không đặt secret phía frontend. Mọi biến có prefix `NEXT_PUBLIC_` đều được đưa vào bundle trình duyệt.

## Quy ước TanStack Query

`components/providers.tsx` tạo `QueryClient` với `retry: 1`, `staleTime: 15_000` và tắt `refetchOnWindowFocus`.

- Query key là mảng ổn định, ví dụ `["classes"]`, `["class-ages"]`; thêm tham số vào key khi dữ liệu phụ thuộc tham số.
- `queryFn` trỏ tới service, không duplicate logic request trong component.
- Sau create/update/delete, dùng `useQueryClient().invalidateQueries` với query key bị ảnh hưởng.
- Dùng `isLoading` cho lần tải đầu và `isPending` của mutation cho trạng thái nút lưu/xóa.
- Đăng nhập/đăng xuất đã clear query cache trong `Providers`; không tạo thêm `QueryClientProvider` trong từng route.

## Biến môi trường

File mẫu: `.env.example`. Để tạo cấu hình local:

```bash
# bash, từ thư mục frontend/
cp .env.example .env.local
```

```powershell
# PowerShell, từ thư mục frontend/
Copy-Item .env.example .env.local
```

| Biến | Mặc định | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | Base URL REST API, đã bao gồm `/api` |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:8080/ws` | Endpoint SockJS + STOMP |

Khi backend chạy cổng 18080:

```env
NEXT_PUBLIC_API_URL=http://localhost:18080/api
NEXT_PUBLIC_WS_URL=http://localhost:18080/ws
```

Khởi động lại development server sau khi sửa `.env.local`. Với production, đặt các biến này ở môi trường build để `npm run build` nhận đúng cấu hình.
