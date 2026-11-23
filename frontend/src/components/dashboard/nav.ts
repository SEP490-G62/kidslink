import type { Role } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const ROLE_NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Tổng quan", href: "/admin", icon: "📊" },
    { label: "Trường học", href: "/admin/schools", icon: "🏫" },
    { label: "Người dùng", href: "/admin/users", icon: "👥" },
  ],
  school_admin: [
    { label: "Tổng quan", href: "/school-admin", icon: "📊" },
    { label: "Lớp học", href: "/school-admin/classes", icon: "🏫" },
    { label: "Học sinh", href: "/school-admin/students", icon: "🧒" },
    { label: "Phụ huynh", href: "/school-admin/parents", icon: "👪" },
    { label: "Lịch học", href: "/school-admin/calendar", icon: "📅" },
    { label: "Thực đơn", href: "/school-admin/menu", icon: "🍱" },
    { label: "Học phí", href: "/school-admin/fees", icon: "💳" },
    { label: "Bài đăng", href: "/school-admin/posts", icon: "📰" },
    { label: "Khiếu nại", href: "/school-admin/complaints", icon: "📮" },
    { label: "Trường học", href: "/school-admin/school", icon: "⚙️" },
  ],
  teacher: [
    { label: "Tổng quan", href: "/teacher", icon: "📊" },
    { label: "Lớp của tôi", href: "/teacher/class", icon: "🏫" },
    { label: "Điểm danh", href: "/teacher/attendance", icon: "✅" },
    { label: "Báo cáo ngày", href: "/teacher/daily-reports", icon: "📝" },
    { label: "Lịch dạy", href: "/teacher/calendar", icon: "📅" },
    { label: "Bảng tin", href: "/teacher/posts", icon: "📰" },
    { label: "Trò chuyện", href: "/teacher/chat", icon: "💬" },
    { label: "Khiếu nại", href: "/teacher/complaints", icon: "📮" },
    { label: "Hồ sơ", href: "/teacher/profile", icon: "👤" },
  ],
  parent: [
    { label: "Tổng quan", href: "/parent", icon: "📊" },
    { label: "Thông tin con", href: "/parent/children", icon: "🧒" },
    { label: "Lịch học", href: "/parent/calendar", icon: "📅" },
    { label: "Báo cáo ngày", href: "/parent/daily-reports", icon: "📝" },
    { label: "Thực đơn", href: "/parent/menu", icon: "🍱" },
    { label: "Học phí", href: "/parent/fees", icon: "💳" },
    { label: "Bảng tin", href: "/parent/posts", icon: "📰" },
    { label: "Trò chuyện", href: "/parent/chat", icon: "💬" },
    { label: "Khiếu nại", href: "/parent/complaints", icon: "📮" },
    { label: "Hồ sơ", href: "/parent/profile", icon: "👤" },
  ],
  health_care_staff: [
    { label: "Tổng quan", href: "/health-care", icon: "📊" },
    { label: "Lớp & học sinh", href: "/health-care/classes", icon: "🏫" },
    { label: "Hồ sơ sức khoẻ", href: "/health-care/records", icon: "🩺" },
    { label: "Thông báo sức khoẻ", href: "/health-care/notices", icon: "🚨" },
    { label: "Hồ sơ", href: "/health-care/profile", icon: "👤" },
  ],
  nutrition_staff: [
    { label: "Tổng quan", href: "/nutrition", icon: "📊" },
    { label: "Món ăn", href: "/nutrition/dishes", icon: "🍲" },
    { label: "Thực đơn tuần", href: "/nutrition/menu", icon: "🍱" },
    { label: "Hồ sơ", href: "/nutrition/profile", icon: "👤" },
  ],
};
