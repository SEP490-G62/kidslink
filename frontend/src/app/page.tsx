import Link from "next/link";

const features = [
  {
    title: "Quản lý lớp học & học sinh",
    description:
      "Tổ chức lớp theo nhóm tuổi, phân công giáo viên, theo dõi danh sách học sinh và liên kết phụ huynh.",
    icon: "🏫",
  },
  {
    title: "Lịch học & thực đơn tuần",
    description:
      "Sắp xếp khung giờ, hoạt động học tập theo ngày. Xây dựng thực đơn theo nhóm tuổi và bữa ăn.",
    icon: "📅",
  },
  {
    title: "Học phí minh bạch",
    description:
      "Thiết lập các khoản phí, giảm giá theo học sinh, phí trễ hạn. Thanh toán trực tuyến qua PayOS hoặc trực tiếp.",
    icon: "💳",
  },
  {
    title: "Báo cáo hằng ngày",
    description:
      "Điểm danh đưa đón, ghi nhận xét mỗi ngày. Phụ huynh theo dõi con mọi lúc, mọi nơi.",
    icon: "📝",
  },
  {
    title: "Sức khoẻ học sinh",
    description:
      "Lưu hồ sơ chiều cao, cân nặng định kỳ. Thông báo khẩn khi trẻ có triệu chứng bất thường.",
    icon: "🩺",
  },
  {
    title: "Trò chuyện & bảng tin",
    description:
      "Nhóm chat lớp, trò chuyện trực tiếp giáo viên — phụ huynh. Chia sẻ khoảnh khắc, bình luận, thả tim.",
    icon: "💬",
  },
];

const roles = [
  { name: "Quản trị trường", description: "Vận hành toàn bộ hoạt động nhà trường", color: "from-indigo-500 to-indigo-600" },
  { name: "Giáo viên", description: "Quản lý lớp, điểm danh, báo cáo", color: "from-emerald-500 to-emerald-600" },
  { name: "Phụ huynh", description: "Đồng hành cùng con mỗi ngày", color: "from-sky-500 to-sky-600" },
  { name: "Nhân viên y tế", description: "Chăm sóc sức khoẻ học sinh", color: "from-rose-500 to-rose-600" },
  { name: "Nhân viên dinh dưỡng", description: "Xây dựng thực đơn cân bằng", color: "from-amber-500 to-amber-600" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              K
            </span>
            <span className="text-xl font-bold text-slate-900">KidsLink</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-indigo-600">
              Tính năng
            </a>
            <a href="#roles" className="hover:text-indigo-600">
              Dành cho ai
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-medium text-indigo-700">
            Nền tảng kết nối mầm non toàn diện
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Kết nối nhà trường và phụ huynh, <span className="text-indigo-600">đồng hành cùng con</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            KidsLink giúp nhà trường vận hành hiệu quả, giáo viên giảm tải giấy tờ và phụ huynh luôn
            nắm bắt hành trình của con mỗi ngày.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
            >
              Đăng nhập hệ thống
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Khám phá tính năng
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Mọi thứ nhà trường cần</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Một hệ thống duy nhất cho quản trị, giảng dạy, dinh dưỡng, y tế và kết nối phụ huynh.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="text-3xl" aria-hidden>
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900">Thiết kế cho từng vai trò</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {roles.map((role) => (
              <div
                key={role.name}
                className={`rounded-2xl bg-gradient-to-br ${role.color} p-6 text-white shadow-lg`}
              >
                <h3 className="font-semibold">{role.name}</h3>
                <p className="mt-2 text-xs text-white/85">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} KidsLink — Nền tảng kết nối mầm non.</p>
          <p>Spring Boot · Next.js · PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
