export type Role =
  | "admin"
  | "school_admin"
  | "teacher"
  | "parent"
  | "health_care_staff"
  | "nutrition_staff";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Quản trị hệ thống",
  school_admin: "Quản trị trường học",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  health_care_staff: "Nhân viên y tế",
  nutrition_staff: "Nhân viên dinh dưỡng",
};

/** Đường dẫn dashboard tương ứng với từng role. */
export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  school_admin: "/school-admin",
  teacher: "/teacher",
  parent: "/parent",
  health_care_staff: "/health-care",
  nutrition_staff: "/nutrition",
};

/** Prefix route được phép truy cập theo role. */
export const ROLE_PREFIX: Record<Role, string> = {
  admin: "/admin",
  school_admin: "/school-admin",
  teacher: "/teacher",
  parent: "/parent",
  health_care_staff: "/health-care",
  nutrition_staff: "/nutrition",
};

export const POST_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
};

export const COMPLAINT_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  approve: "Đã duyệt",
  reject: "Từ chối",
};

/** Invoice.status: 0 pending, 1 paid, 2 overdue */
export const INVOICE_STATUS_LABEL: Record<number, string> = {
  0: "Chưa thanh toán",
  1: "Đã thanh toán",
  2: "Quá hạn",
};

export const INVOICE_STATUS_COLOR: Record<number, string> = {
  0: "bg-amber-100 text-amber-800",
  1: "bg-emerald-100 text-emerald-800",
  2: "bg-rose-100 text-rose-800",
};

export const LATE_FEE_TYPE_LABEL: Record<string, string> = {
  none: "Không có",
  fixed: "Cố định (VNĐ)",
  percentage: "Theo phần trăm (%)",
};

export const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Cha" },
  { value: "mother", label: "Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
  { value: "grandparent", label: "Ông/Bà" },
  { value: "other", label: "Khác" },
];

export const WEEKDAY_LABEL: Record<string, string> = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};
