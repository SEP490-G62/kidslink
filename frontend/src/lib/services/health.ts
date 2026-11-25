import { api, queryString } from "@/lib/api";
import type { Complaint, ComplaintType, DailyReport, HealthNotice, HealthRecord, Pickup } from "@/lib/types";
import type { User } from "@/lib/types";

// ---------- Daily reports ----------
export function teacherCheckin(payload: {
  student_id: string;
  report_date?: string;
  checkin_time: string;
  comments?: string;
}): Promise<DailyReport> {
  return api.post<DailyReport>("/teachers/daily-reports/checkin", payload);
}

export function teacherCheckout(payload: {
  student_id: string;
  report_date?: string;
  checkout_time: string;
}): Promise<DailyReport> {
  return api.put<DailyReport>("/teachers/daily-reports/checkout", payload);
}

export function teacherUpdateComment(id: string, comments: string): Promise<DailyReport> {
  return api.put<DailyReport>(`/teachers/daily-reports/${id}/comment`, { comments });
}

export function weeklyReports(studentId: string): Promise<DailyReport[]> {
  return api.get<DailyReport[]>(`/teachers/students/${studentId}/daily-reports/weekly`);
}

export function parentDailyReports(studentId?: string, from?: string, to?: string): Promise<DailyReport[]> {
  return api.get<DailyReport[]>(`/parent/daily-reports${queryString({ student_id: studentId, from, to })}`);
}

// ---------- Teacher ----------
export function getTeacherClasses(): Promise<unknown> {
  return api.get("/teachers/class");
}

export function getClassStudents(): Promise<unknown[]> {
  return api.get("/teachers/class/students");
}

export function getAttendance(date: string): Promise<unknown[]> {
  return api.get(`/teachers/class/students/attendance/${date}`);
}

export function getStudentDetail(id: string): Promise<unknown> {
  return api.get(`/teachers/students/${id}`);
}

// ---------- Health staff ----------
/** Lớp học do nhân viên y tế phụ trách (theo trường). */
export interface HealthClass {
  id: string;
  className: string;
  academicYear?: string;
  classAgeName?: string | null;
  teacherName?: string | null;
  coTeacherName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

/** Học sinh trong lớp — shape rút gọn của `/health-staff/classes/{id}/students`. */
export interface HealthStudent {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  dob?: string | null;
  gender?: number | null;
  status?: number | null;
  allergy?: string | null;
  discount?: number | null;
}

export interface HealthStaffProfile {
  id: string;
  qualification?: string | null;
  major?: string | null;
  experienceYears?: number | null;
  note?: string | null;
}

export interface HealthStaffProfileResponse {
  user: User;
  staff: HealthStaffProfile;
}

/** Định dạng payload của `POST/PUT /health-staff/health/records`. */
export interface HealthRecordPayload {
  student_id: string;
  checkup_date: string;
  height_cm: number;
  weight_kg: number;
  note: string;
}

/** Định dạng payload của `POST/PUT /health-staff/health/notices`. */
export interface HealthNoticePayload {
  student_id: string;
  symptoms: string;
  actions_taken: string;
  medications: string;
  notice_time: string;
  note: string;
}

export function healthClasses(): Promise<HealthClass[]> {
  return api.get<HealthClass[]>("/health-staff/classes");
}

export function healthClassStudents(classId: string): Promise<HealthStudent[]> {
  return api.get<HealthStudent[]>(`/health-staff/classes/${classId}/students`);
}

export function listHealthRecords(studentId?: string): Promise<HealthRecord[]> {
  return api.get<HealthRecord[]>(`/health-staff/health/records${queryString({ student_id: studentId })}`);
}

export function createHealthRecord(payload: Partial<HealthRecord> & Partial<HealthRecordPayload>): Promise<HealthRecord> {
  return api.post<HealthRecord>("/health-staff/health/records", payload);
}

export function updateHealthRecord(
  id: string,
  payload: Partial<HealthRecord> & Partial<HealthRecordPayload>,
): Promise<HealthRecord> {
  return api.put<HealthRecord>(`/health-staff/health/records/${id}`, payload);
}

export function deleteHealthRecord(id: string): Promise<void> {
  return api.delete(`/health-staff/health/records/${id}`);
}

export function listHealthNotices(studentId?: string): Promise<HealthNotice[]> {
  return api.get<HealthNotice[]>(`/health-staff/health/notices${queryString({ student_id: studentId })}`);
}

export function createHealthNotice(
  payload: Partial<HealthNotice> & Partial<HealthNoticePayload>,
): Promise<HealthNotice> {
  return api.post<HealthNotice>("/health-staff/health/notices", payload);
}

export function updateHealthNotice(
  id: string,
  payload: Partial<HealthNotice> & Partial<HealthNoticePayload>,
): Promise<HealthNotice> {
  return api.put<HealthNotice>(`/health-staff/health/notices/${id}`, payload);
}

export function deleteHealthNotice(id: string): Promise<void> {
  return api.delete(`/health-staff/health/notices/${id}`);
}

export function getHealthStaffProfile(): Promise<HealthStaffProfileResponse> {
  return api.get<HealthStaffProfileResponse>("/health-staff/profile");
}

export function updateHealthStaffProfile(payload: {
  full_name?: string;
  avatar_url?: string | null;
  email?: string;
  phone_number?: string;
  qualification?: string;
  major?: string;
  experience_years?: number | null;
  note?: string;
}): Promise<HealthStaffProfileResponse> {
  return api.put<HealthStaffProfileResponse>("/health-staff/profile", payload);
}

// ---------- Complaints ----------
type Complainant = "parent" | "teachers" | "school-admin";

export function listComplaintTypes(role: Complainant): Promise<ComplaintType[]> {
  if (role === "school-admin") {
    return api.get<ComplaintType[]>("/school-admin/complaints/types/list");
  }
  return api.get<ComplaintType[]>(`/${role}/complaints/types`);
}

export function createComplaintType(payload: { name: string; description?: string; category: string[] }): Promise<ComplaintType> {
  return api.post<ComplaintType>("/school-admin/complaints/types", payload);
}

export function updateComplaintType(id: string, payload: Partial<ComplaintType>): Promise<ComplaintType> {
  return api.put<ComplaintType>(`/school-admin/complaints/types/${id}`, payload);
}

export function deleteComplaintType(id: string): Promise<void> {
  return api.delete(`/school-admin/complaints/types/${id}`);
}

export function createComplaint(
  role: Exclude<Complainant, "school-admin">,
  payload: { complaint_type_id: string; reason: string; image?: string },
): Promise<Complaint> {
  return api.post<Complaint>(`/${role}/complaints`, payload);
}

export function listMyComplaints(role: Exclude<Complainant, "school-admin">): Promise<Complaint[]> {
  return api.get<Complaint[]>(`/${role}/complaints`);
}

export function getComplaint(role: Complainant, id: string): Promise<Complaint> {
  return api.get<Complaint>(`/${role}/complaints/${id}`);
}

export function listAllComplaints(status?: string): Promise<Complaint[]> {
  return api.get<Complaint[]>(`/school-admin/complaints${queryString({ status })}`);
}

export function complaintStats(): Promise<{ pending: number; approve: number; reject: number; total: number }> {
  return api.get("/school-admin/complaints/stats");
}

export function approveComplaint(id: string, response?: string): Promise<Complaint> {
  return api.put<Complaint>(`/school-admin/complaints/${id}/approve`, { response });
}

export function rejectComplaint(id: string, response?: string): Promise<Complaint> {
  return api.put<Complaint>(`/school-admin/complaints/${id}/reject`, { response });
}

// ---------- Parent child info & pickups ----------
export interface ChildInfo {
  student: unknown;
  parents?: unknown[];
  pickups?: Pickup[];
  health_records?: HealthRecord[];
  health_notices?: HealthNotice[];
}

export function getChildInfo(studentId: string): Promise<ChildInfo> {
  return api.get<ChildInfo>(`/parent/child-info/${studentId}`);
}

export function createPickup(studentId: string, payload: Partial<Pickup>): Promise<Pickup> {
  return api.post<Pickup>(`/parent/pickups/${studentId}`, payload);
}

export function updatePickup(studentId: string, pickupId: string, payload: Partial<Pickup>): Promise<Pickup> {
  return api.put<Pickup>(`/parent/pickups/${pickupId}/${studentId}`, payload);
}

export function deletePickup(studentId: string, pickupId: string): Promise<void> {
  return api.delete(`/parent/pickups/${pickupId}/${studentId}`);
}
