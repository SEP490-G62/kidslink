import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="hidden w-1/2 flex-col justify-between bg-indigo-600 p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">
            K
          </span>
          <span className="text-2xl font-bold">KidsLink</span>
        </Link>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Đồng hành cùng con <br /> mỗi ngày đến trường
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Theo dõi lịch học, thực đơn, báo cáo hằng ngày, học phí và trò chuyện trực tiếp với giáo viên —
            tất cả trong một nền tảng.
          </p>
        </div>
        <p className="text-sm text-indigo-200">Nền tảng kết nối mầm non toàn diện</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
