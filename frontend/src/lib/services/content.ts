import { api, queryString } from "@/lib/api";
import type { Complaint, Conversation, Fee, Invoice, Message, Post, PostComment } from "@/lib/types";

// ---------- Posts ----------
export type FeedRole = "parent" | "teachers" | "school-admin";

export function listPosts(role: FeedRole, classId?: string): Promise<Post[]> {
  return api.get<Post[]>(`/${role}/posts${queryString({ class_id: classId })}`);
}

export function listMyPosts(role: FeedRole): Promise<Post[]> {
  return api.get<Post[]>(`/${role}/posts/my-posts`);
}

export function createPost(
  role: FeedRole,
  payload: { content: string; image_urls?: string[]; class_id?: string },
): Promise<Post> {
  return api.post<Post>(`/${role}/posts`, payload);
}

export function updatePost(role: FeedRole, id: string, payload: { content: string }): Promise<Post> {
  return api.put<Post>(`/${role}/posts/${id}`, payload);
}

export function deletePost(role: FeedRole, id: string): Promise<void> {
  return api.delete(`/${role}/posts/${id}`);
}

export function toggleLike(role: FeedRole, id: string): Promise<{ liked: boolean; like_count: number }> {
  return api.post(`/${role}/posts/${id}/like`);
}

export function listLikes(role: FeedRole, id: string): Promise<unknown[]> {
  return api.get(`/${role}/posts/${id}/likes`);
}

export function listComments(role: FeedRole, postId: string): Promise<PostComment[]> {
  return api.get<PostComment[]>(`/${role}/posts/${postId}/comments`);
}

export function createComment(
  role: FeedRole,
  postId: string,
  payload: { contents: string; parent_comment_id?: string },
): Promise<PostComment> {
  return api.post<PostComment>(`/${role}/posts/${postId}/comments`, payload);
}

export function deleteComment(role: FeedRole, id: string): Promise<void> {
  return api.delete(`/${role}/comments/${id}`);
}

export function approvePost(id: string): Promise<Post> {
  return api.put<Post>(`/school-admin/posts/${id}/status`, { status: "approved" });
}

// ---------- Messaging ----------
export function listConversations(): Promise<Conversation[]> {
  return api.get<Conversation[]>("/messaging/conversations");
}

export function getConversation(id: string): Promise<Conversation> {
  return api.get<Conversation>(`/messaging/conversations/${id}`);
}

export function createConversation(payload: { title: string; class_id?: string }): Promise<Conversation> {
  return api.post<Conversation>("/messaging/conversations", payload);
}

export function createDirectConversation(payload: { user_id: string; class_id?: string }): Promise<Conversation> {
  return api.post<Conversation>("/messaging/conversations/direct", payload);
}

export function listMessages(conversationId: string, limit = 50, before?: string): Promise<Message[]> {
  return api.get<Message[]>(
    `/messaging/conversations/${conversationId}/messages${queryString({ limit, before })}`,
  );
}

export function sendMessage(payload: {
  conversation_id: string;
  content?: string;
  image_url?: string;
}): Promise<Message> {
  return api.post<Message>("/messaging/messages", payload);
}

export function markRead(conversationId: string): Promise<void> {
  return api.put(`/messaging/conversations/${conversationId}/read`);
}

export function unreadCount(): Promise<{ count: number }> {
  return api.get("/messaging/unread-count");
}

export function teachersByStudent(studentId: string): Promise<unknown[]> {
  return api.get(`/messaging/teachers-by-student/${studentId}`);
}

export function parentsByTeacherClass(): Promise<unknown[]> {
  return api.get("/messaging/parents-by-teacher-class");
}

export function createClassChatGroup(): Promise<Conversation> {
  return api.post<Conversation>("/teachers/class/chat-group");
}

// ---------- Parent data ----------
export interface ChildSummary {
  id: string;
  full_name: string;
  dob: string;
  gender: number;
  avatar_url?: string;
  class_id?: string;
  class_name?: string;
  school_class?: { id: string; class_name: string };
}

export function getChildren(): Promise<ChildSummary[]> {
  return api.get<ChildSummary[]>("/parent/children");
}

export function getParentFees(studentId?: string): Promise<{ invoices: Invoice[]; fees: Fee[] }> {
  return api.get(`/parent/fees${queryString({ student_id: studentId })}`);
}

export function getUnpaidCount(): Promise<{ count: number }> {
  return api.get("/parent/fees/unpaid-count");
}

export function createPayosLink(invoiceId: string): Promise<{
  checkout_url?: string;
  qr_code?: string;
  qr_url?: string;
  order_code?: number;
}> {
  return api.post("/parent/fees/payos", { invoice_id: invoiceId });
}

export function checkPayosStatus(invoiceId: string): Promise<{ status?: number; paid?: boolean }> {
  return api.post("/parent/fees/payos/status", { invoice_id: invoiceId });
}

export type { Complaint };

// ---------- School-admin fees ----------
export interface SchoolFee {
  id: string;
  fee_name: string;
  description: string;
  amount: number;
  late_fee_type: "none" | "fixed" | "percentage";
  late_fee_value: number;
  late_fee_description?: string;
}

export interface SchoolFeePayload {
  feeName: string;
  description: string;
  amount: number;
  lateFeeType: string;
  lateFeeValue: number;
}

export function listSchoolFees(): Promise<SchoolFee[] | { fees: SchoolFee[] }> {
  return api.get<SchoolFee[] | { fees: SchoolFee[] }>("/school-admin/fees");
}

export function createSchoolFee(payload: SchoolFeePayload): Promise<SchoolFee> {
  return api.post<SchoolFee>("/school-admin/fees", payload);
}

export function deleteSchoolFee(id: string): Promise<void> {
  return api.delete(`/school-admin/fees/${id}`);
}
