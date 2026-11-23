import type { Role } from "./constants";

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: Role;
  avatar_url: string;
  email: string;
  phone_number: string;
  status: number;
  school_id: string | null;
  address?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface School {
  id: string;
  school_name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  status: number;
  qr_data?: string;
  payos_config?: PayosConfig;
}

export interface PayosConfig {
  client_id?: string;
  api_key?: string;
  checksum_key?: string;
  account_number?: string;
  account_name?: string;
  bank_code?: string;
  active?: boolean;
  webhook_url?: string;
}

export interface ClassAge {
  id: string;
  age: number;
  age_name: string;
  school_id: string;
}

export interface SchoolClass {
  id: string;
  class_name: string;
  academic_year: string;
  school_id: string;
  class_age_id: string;
  teacher_id?: string | null;
  co_teacher_id?: string | null;
  start_date: string;
  end_date: string;
  class_age?: ClassAge;
  teacher?: TeacherProfile | null;
  co_teacher?: TeacherProfile | null;
  student_count?: number;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  qualification?: string;
  major?: string;
  experience_years?: number;
  note?: string;
  user?: User;
}

export interface Student {
  id: string;
  full_name: string;
  school_id: string;
  dob: string;
  gender: number;
  avatar_url?: string;
  status: number;
  allergy?: string;
  class_id?: string;
  class_name?: string;
  parents?: ParentLink[];
}

export interface ParentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  parent?: { id: string; user_id: string; user?: User };
}

export interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
  discount: number;
  student?: Student;
  school_class?: SchoolClass;
}

export interface Slot {
  id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  school_id: string;
}

export interface Activity {
  id: string;
  activity_name: string;
  description: string;
  require_outdoor: number;
  school_id: string;
}

export interface WeekDay {
  id: string;
  day_of_week: string;
}

export interface CalendarEntry {
  id: string;
  class_id: string;
  weekday_id: string;
  date: string;
  slot_id: string;
  activity_id: string;
  teacher_id: string;
  slot?: Slot;
  activity?: Activity;
  weekday?: WeekDay;
  teacher?: TeacherProfile;
}

export interface Meal {
  id: string;
  meal: string;
}

export interface Dish {
  id: string;
  dish_name: string;
  description: string;
  school_id: string;
  category?: Meal[];
}

export interface ClassAgeMeal {
  id: string;
  class_age_id: string;
  meal_id: string;
  weekday_id: string;
  date: string;
  dishes?: Dish[];
  class_age?: ClassAge;
  meal?: Meal;
  weekday?: WeekDay;
}

export interface Fee {
  id: string;
  school_id: string;
  fee_name: string;
  description: string;
  amount: number;
  late_fee_type: "none" | "fixed" | "percentage";
  late_fee_value: number;
  late_fee_description?: string;
}

export interface ClassFee {
  id: string;
  class_id: string;
  fee_id: string;
  due_date: string;
  note?: string;
  status: number;
  fee?: Fee;
  school_class?: SchoolClass;
}

export interface Invoice {
  id: string;
  class_fee_id: string;
  amount_due: number;
  due_date: string;
  student_class_id: string;
  discount: number;
  payment_id?: string | null;
  status: number;
  payos_order_code?: number | null;
  payos_checkout_url?: string | null;
  payos_qr_code?: string | null;
  payos_qr_url?: string | null;
  payos_expired_at?: string | null;
  late_fee_amount?: number | null;
  student?: Student;
  fee?: Fee;
}

export interface Post {
  id: string;
  content: string;
  status: "pending" | "approved";
  user_id: string;
  class_id?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: Pick<User, "id" | "full_name" | "avatar_url" | "role">;
  school_class?: SchoolClass;
  images?: { id: string; image_url: string }[];
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

export interface PostComment {
  id: string;
  contents: string;
  create_at: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  user?: Pick<User, "id" | "full_name" | "avatar_url" | "role">;
  replies?: PostComment[];
}

export interface Conversation {
  id: string;
  title: string;
  create_at: string;
  last_message_at: string;
  class_id?: string | null;
  is_class_group: boolean;
  unread_count?: number;
  last_message?: Message | null;
  participants?: { id: string; user_id: string; user?: Pick<User, "id" | "full_name" | "avatar_url" | "role"> }[];
}

export interface Message {
  id: string;
  content?: string;
  image_url?: string;
  send_at: string;
  read_status: number;
  conversation_id: string;
  sender_id: string;
  sender?: Pick<User, "id" | "full_name" | "avatar_url" | "role">;
  tempId?: string;
}

export interface ComplaintType {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  category?: string[];
}

export interface Complaint {
  id: string;
  complaint_type_id: string;
  school_id: string;
  complaint_type_name: string;
  reason: string;
  image?: string;
  status: "pending" | "approve" | "reject";
  user_id: string;
  response?: string;
  createdAt: string;
  user?: Pick<User, "id" | "full_name" | "avatar_url" | "role">;
}

export interface DailyReport {
  id: string;
  report_date: string;
  checkin_time?: string;
  checkout_time?: string;
  comments?: string;
  student_id: string;
  teacher_checkin_id?: string | null;
  teacher_checkout_id?: string | null;
  student?: Student;
}

export interface HealthRecord {
  id: string;
  checkup_date: string;
  height_cm: number;
  weight_kg: number;
  note: string;
  student_id: string;
  health_care_staff_id: string;
  student?: Student;
}

export interface HealthNotice {
  id: string;
  student_id: string;
  symptoms: string;
  actions_taken: string;
  medications: string;
  notice_time: string;
  note: string;
  health_care_staff_id: string;
  createdAt: string;
  student?: Student;
}

export interface Pickup {
  id: string;
  full_name: string;
  relationship: string;
  id_card_number: string;
  avatar_url: string;
  phone: string;
}
