/**
 * Kiểu dữ liệu và hàm chuẩn hoá dùng chung cho các màn giáo viên.
 *
 * `TeacherController` / `TeacherDailyReportController` trả `Map` lồng nhau và các hàm
 * service tương ứng khai báo `unknown`; mỗi `normalize*` dưới đây đọc response đúng một
 * lần và trả về kiểu tường minh để dùng trong JSX.
 */
import { format } from "date-fns";
import type { DailyReport, Student } from "@/lib/types";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function integer(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/** Một lớp giáo viên đang phụ trách. */
export interface TeacherClass {
  id: string;
  name: string;
  academic_year: string;
}

export interface TeacherClasses {
  teacher_id: string;
  /** Gom theo năm học, năm mới nhất trước. */
  groups: { academic_year: string; classes: TeacherClass[] }[];
  latest_academic_year: string;
  has_latest_academic_year_class: boolean;
  /** Toàn bộ lớp, đã phẳng hoá. */
  all: TeacherClass[];
}

function readTeacherClass(raw: unknown): TeacherClass | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = text(record.id);
  if (!id) return null;
  return { id, name: text(record.name) || "Lớp học", academic_year: text(record.academic_year) };
}

export function normalizeTeacherClasses(raw: unknown): TeacherClasses {
  const empty: TeacherClasses = {
    teacher_id: "",
    groups: [],
    latest_academic_year: "",
    has_latest_academic_year_class: false,
    all: [],
  };
  if (!raw || typeof raw !== "object") return empty;
  const record = raw as Record<string, unknown>;
  const rawGroups = Array.isArray(record.data) ? record.data : [];
  const groups = rawGroups.flatMap((rawGroup) => {
    if (!rawGroup || typeof rawGroup !== "object") return [];
    const group = rawGroup as Record<string, unknown>;
    const classes = (Array.isArray(group.classes) ? group.classes : [])
      .map(readTeacherClass)
      .filter((c): c is TeacherClass => c !== null);
    return classes.length === 0 ? [] : [{ academic_year: text(group.academic_year), classes }];
  });
  const metadata = record.metadata && typeof record.metadata === "object"
    ? (record.metadata as Record<string, unknown>)
    : {};
  return {
    teacher_id: text(record.teacher_id),
    groups,
    latest_academic_year: text(metadata.latest_academic_year),
    has_latest_academic_year_class: metadata.has_latest_academic_year_class === true,
    all: groups.flatMap((group) => group.classes),
  };
}

export interface TeacherStudent extends Student {
  discount?: number;
}

export interface TeacherStudents {
  class_id: string;
  class_name: string;
  students: TeacherStudent[];
}

export function readTeacherStudent(raw: unknown): TeacherStudent | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = text(record.id);
  if (!id) return null;
  return {
    id,
    full_name: text(record.full_name) || "Học sinh",
    school_id: text(record.school_id),
    dob: text(record.dob),
    gender: integer(record.gender) ?? -1,
    avatar_url: text(record.avatar_url) || undefined,
    status: integer(record.status) ?? 0,
    allergy: text(record.allergy) || undefined,
    discount: integer(record.discount),
  };
}

export function normalizeTeacherStudents(raw: unknown): TeacherStudents {
  if (!raw || typeof raw !== "object") return { class_id: "", class_name: "", students: [] };
  const record = raw as Record<string, unknown>;
  const classInfo = record.class_info && typeof record.class_info === "object"
    ? (record.class_info as Record<string, unknown>)
    : {};
  return {
    class_id: text(record.class_id),
    class_name: text(classInfo.name),
    students: (Array.isArray(record.students) ? record.students : [])
      .map(readTeacherStudent)
      .filter((s): s is TeacherStudent => s !== null),
  };
}

/** `GET /teachers/class/students/attendance/{date}`. */
export interface AttendanceStudent extends TeacherStudent {
  has_checkin: boolean;
  has_checkout: boolean;
  checkin_time: string;
  checkout_time: string;
  report: DailyReport | null;
}

export interface Attendance {
  date: string;
  class_name: string;
  total_students: number;
  checked_in: number;
  checked_out: number;
  attendance_rate: number;
  has_schedule: boolean;
  students: AttendanceStudent[];
}

function readReport(raw: unknown): DailyReport | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = text(record.id);
  if (!id) return null;
  return {
    id,
    report_date: text(record.report_date),
    checkin_time: text(record.checkin_time),
    checkout_time: text(record.checkout_time),
    comments: text(record.comments),
    student_id: text(record.student_id),
  };
}

export function normalizeAttendance(raw: unknown): Attendance {
  const empty: Attendance = {
    date: "",
    class_name: "",
    total_students: 0,
    checked_in: 0,
    checked_out: 0,
    attendance_rate: 0,
    has_schedule: false,
    students: [],
  };
  if (!raw || typeof raw !== "object") return empty;
  const record = raw as Record<string, unknown>;
  const statistics = record.statistics && typeof record.statistics === "object"
    ? (record.statistics as Record<string, unknown>)
    : {};
  const classInfo = record.class_info && typeof record.class_info === "object"
    ? (record.class_info as Record<string, unknown>)
    : {};
  const students = (Array.isArray(record.students) ? record.students : []).flatMap(
    (item): AttendanceStudent[] => {
      const student = readTeacherStudent(item);
      if (!student || !item || typeof item !== "object") return [];
      const attendance = (item as Record<string, unknown>).attendance;
      const flags = attendance && typeof attendance === "object"
        ? (attendance as Record<string, unknown>)
        : {};
      return [
        {
          ...student,
          has_checkin: flags.has_checkin === true,
          has_checkout: flags.has_checkout === true,
          checkin_time: text(flags.checkin_time),
          checkout_time: text(flags.checkout_time),
          report: readReport((item as Record<string, unknown>).report),
        },
      ];
    },
  );
  return {
    date: text(record.date),
    class_name: text(classInfo.name),
    total_students: integer(statistics.total_students) ?? students.length,
    checked_in: integer(statistics.checked_in) ?? 0,
    checked_out: integer(statistics.checked_out) ?? 0,
    attendance_rate: integer(statistics.attendance_rate) ?? 0,
    has_schedule: record.has_schedule === true,
    students,
  };
}

/** `GET /teachers/students/{id}`. */
export interface StudentParent {
  parent_id: string;
  relationship: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface StudentPickup {
  id: string;
  full_name: string;
  relationship: string;
  phone: string;
  id_card_number: string;
}

export interface StudentDetail {
  student: TeacherStudent | null;
  parents: StudentParent[];
  pickups: StudentPickup[];
  classes: TeacherClass[];
}

export function normalizeStudentDetail(raw: unknown): StudentDetail {
  if (!raw || typeof raw !== "object") return { student: null, parents: [], pickups: [], classes: [] };
  const record = raw as Record<string, unknown>;
  return {
    student: readTeacherStudent(record.student),
    parents: (Array.isArray(record.parents) ? record.parents : []).flatMap((rawParent): StudentParent[] => {
      if (!rawParent || typeof rawParent !== "object") return [];
      const parent = rawParent as Record<string, unknown>;
      const user = parent.user && typeof parent.user === "object"
        ? (parent.user as Record<string, unknown>)
        : {};
      return [
        {
          parent_id: text(parent.parent_id),
          relationship: text(parent.relationship),
          full_name: text(user.full_name),
          email: text(user.email),
          phone_number: text(user.phone_number),
        },
      ];
    }),
    pickups: (Array.isArray(record.pickups) ? record.pickups : []).flatMap((rawPickup): StudentPickup[] => {
      if (!rawPickup || typeof rawPickup !== "object") return [];
      const pickup = rawPickup as Record<string, unknown>;
      return [
        {
          id: text(pickup.id),
          full_name: text(pickup.full_name),
          relationship: text(pickup.relationship),
          phone: text(pickup.phone),
          id_card_number: text(pickup.id_card_number),
        },
      ];
    }),
    classes: (Array.isArray(record.classes) ? record.classes : [])
      .map(readTeacherClass)
      .filter((c): c is TeacherClass => c !== null),
  };
}

/** Một tiết dạy trong `GET /teachers/teaching-calendar`. */
export interface TeachingSlot {
  id: string;
  class_id: string;
  class_name: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  activity_name: string;
  activity_description: string;
}

export interface TeachingDay {
  date: string;
  slots: TeachingSlot[];
}

export interface TeachingCalendar {
  classes: TeacherClass[];
  days: TeachingDay[];
}

export function normalizeTeachingCalendar(raw: unknown): TeachingCalendar {
  if (!raw || typeof raw !== "object") return { classes: [], days: [] };
  const record = raw as Record<string, unknown>;
  const days = (Array.isArray(record.calendars) ? record.calendars : []).flatMap(
    (rawDay): TeachingDay[] => {
      if (!rawDay || typeof rawDay !== "object") return [];
      const day = rawDay as Record<string, unknown>;
      const date = text(day.date);
      if (!date) return [];
      const slots = (Array.isArray(day.slots) ? day.slots : []).flatMap((rawSlot): TeachingSlot[] => {
        if (!rawSlot || typeof rawSlot !== "object") return [];
        const slot = rawSlot as Record<string, unknown>;
        const id = text(slot.id);
        if (!id) return [];
        const activity = slot.activity && typeof slot.activity === "object"
          ? (slot.activity as Record<string, unknown>)
          : {};
        return [
          {
            id,
            class_id: text(slot.class_id),
            class_name: text(slot.class_name) || "Lớp học",
            slot_name: text(slot.slot_name),
            start_time: text(slot.start_time),
            end_time: text(slot.end_time),
            activity_name: text(activity.name),
            activity_description: text(activity.description),
          },
        ];
      });
      return [{ date, slots }];
    },
  );
  return {
    classes: (Array.isArray(record.classes) ? record.classes : [])
      .map(readTeacherClass)
      .filter((c): c is TeacherClass => c !== null),
    days,
  };
}

/** Giờ `HH:mm` hiện tại (giờ máy người dùng). */
export function currentTimeHHmm(): string {
  return format(new Date(), "HH:mm");
}

/** Tập khung giờ xuất hiện trong tuần, sắp theo giờ bắt đầu — dùng dựng hàng của lưới lịch. */
export function collectSlots(days: TeachingDay[]): { key: string; label: string }[] {
  const slots = new Map<string, { key: string; label: string }>();
  for (const day of days) {
    for (const slot of day.slots) {
      if (!slot.start_time || slots.has(slot.start_time)) continue;
      slots.set(slot.start_time, {
        key: slot.start_time,
        label: slot.slot_name ? `${slot.slot_name} (${slot.start_time}–${slot.end_time})` : `${slot.start_time}–${slot.end_time}`,
      });
    }
  }
  return [...slots.values()].sort((a, b) => a.key.localeCompare(b.key));
}
