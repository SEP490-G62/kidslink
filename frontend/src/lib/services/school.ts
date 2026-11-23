import { api } from "@/lib/api";
import type { ClassAge, School, SchoolClass, Student, StudentClass, User } from "@/lib/types";

export function listSchools(): Promise<School[]> {
  return api.get<School[]>("/admin/schools");
}

export function getSchool(id: string): Promise<School> {
  return api.get<School>(`/admin/schools/${id}`);
}

export function createSchool(payload: Partial<School>): Promise<School> {
  return api.post<School>("/admin/schools", payload);
}

export function updateSchool(id: string, payload: Partial<School>): Promise<School> {
  return api.put<School>(`/admin/schools/${id}`, payload);
}

export function deleteSchool(id: string): Promise<void> {
  return api.delete(`/admin/schools/${id}`);
}

export function updateSchoolStatus(id: string, status: number): Promise<School> {
  return api.put<School>(`/admin/schools/${id}/status`, { status });
}

export function getMySchool(): Promise<School> {
  return api.get<School>("/school-admin/school");
}

export function updateMySchool(payload: Partial<School>): Promise<School> {
  return api.put<School>("/school-admin/school", payload);
}

// ---------- ClassAge ----------
export function listClassAges(): Promise<ClassAge[]> {
  return api.get<ClassAge[]>("/class-ages");
}

export function createClassAge(payload: { age: number; age_name: string }): Promise<ClassAge> {
  return api.post<ClassAge>("/class-ages", payload);
}

export function updateClassAge(id: string, payload: { age: number; age_name: string }): Promise<ClassAge> {
  return api.put<ClassAge>(`/class-ages/${id}`, payload);
}

export function deleteClassAge(id: string): Promise<void> {
  return api.delete(`/class-ages/${id}`);
}

// ---------- Class ----------
export function listClasses(): Promise<SchoolClass[]> {
  return api.get<SchoolClass[]>("/classes");
}

export function getClass(id: string): Promise<SchoolClass> {
  return api.get<SchoolClass>(`/classes/${id}`);
}

export function createClass(payload: Partial<SchoolClass>): Promise<SchoolClass> {
  return api.post<SchoolClass>("/classes", payload);
}

export function updateClass(id: string, payload: Partial<SchoolClass>): Promise<SchoolClass> {
  return api.put<SchoolClass>(`/classes/${id}`, payload);
}

export function deleteClass(id: string): Promise<void> {
  return api.delete(`/classes/${id}`);
}

export function promoteClass(id: string, payload: { class_age_id: string; academic_year?: string }): Promise<SchoolClass> {
  return api.post<SchoolClass>(`/classes/${id}/promote`, payload);
}

export function getEligibleStudents(classId: string): Promise<Student[]> {
  return api.get<Student[]>(`/classes/${classId}/eligible-students`);
}

export function addStudentsToClass(
  classId: string,
  payload: { student_ids: string[]; discount?: number },
): Promise<StudentClass[]> {
  return api.post<StudentClass[]>(`/classes/${classId}/students`, payload);
}

export function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  return api.delete(`/classes/${classId}/students/${studentId}`);
}

// ---------- Student ----------
export function listStudents(): Promise<Student[]> {
  return api.get<Student[]>("/student/all");
}

export function listStudentsByClass(classId: string): Promise<Student[]> {
  return api.get<Student[]>(`/student/class/${classId}`);
}

export function getStudent(id: string): Promise<Student> {
  return api.get<Student>(`/student/${id}`);
}

export function createStudent(payload: Partial<Student>): Promise<Student> {
  return api.post<Student>("/student", payload);
}

export function updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
  return api.put<Student>(`/student/${id}`, payload);
}

export function transferStudent(id: string, payload: { class_id: string; discount?: number }): Promise<StudentClass> {
  return api.post<StudentClass>(`/student/${id}/transfer`, payload);
}

export function updateStudentStatus(id: string, status: number): Promise<Student> {
  return api.patch<Student>(`/student/${id}/status`, { status });
}

export function linkParentToStudent(
  studentId: string,
  payload: { parent_id: string; relationship: string },
): Promise<unknown> {
  return api.post(`/student/${studentId}/parents`, payload);
}

export function unlinkParent(studentId: string, parentId: string): Promise<void> {
  return api.delete(`/student/${studentId}/parents/${parentId}`);
}

export function deleteStudent(id: string): Promise<void> {
  return api.delete(`/student/${id}`);
}

// ---------- Parent CRUD ----------
export interface ParentWithChildren {
  id: string;
  user_id: string;
  user?: User;
  children?: Student[];
}

export function listParents(): Promise<ParentWithChildren[]> {
  return api.get<ParentWithChildren[]>("/parentcrud");
}

export function createParent(payload: {
  full_name: string;
  username: string;
  password: string;
  email: string;
  phone_number: string;
}): Promise<ParentWithChildren> {
  return api.post<ParentWithChildren>("/parentcrud", payload);
}

export function linkParentStudent(payload: {
  parent_id: string;
  student_id: string;
  relationship: string;
}): Promise<unknown> {
  return api.post("/parentcrud/link", payload);
}

export function updateParent(id: string, payload: Partial<User>): Promise<ParentWithChildren> {
  return api.put<ParentWithChildren>(`/parentcrud/${id}`, payload);
}

export function deleteParent(id: string): Promise<void> {
  return api.delete(`/parentcrud/${id}`);
}
