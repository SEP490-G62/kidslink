import { api, queryString } from "@/lib/api";
import type { User } from "@/lib/types";

export function getMe(): Promise<User> {
  return api.get<User>("/users/me");
}

export function updateMe(payload: Partial<User> & { avatar_url?: string }): Promise<User> {
  return api.put<User>("/users/me", payload);
}

export function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message?: string }> {
  return api.put("/users/change-password", payload);
}

export interface UserQuery {
  q?: string;
  role?: string;
  school_id?: string;
  status?: number;
  page?: number;
  size?: number;
}

export function listUsers(query: UserQuery = {}): Promise<User[] | { items: User[]; total: number }> {
  return api.get(`/users${queryString(query)}`);
}

export function getUser(id: string): Promise<User> {
  return api.get<User>(`/users/${id}`);
}

export function createUser(payload: Partial<User> & { password?: string }): Promise<User> {
  return api.post<User>("/users", payload);
}

export function updateUser(id: string, payload: Partial<User>): Promise<User> {
  return api.put<User>(`/users/${id}`, payload);
}

export function deleteUser(id: string): Promise<void> {
  return api.delete(`/users/${id}`);
}

export function hardDeleteUser(id: string): Promise<void> {
  return api.delete(`/users/${id}/hard`);
}

export function restoreUser(id: string): Promise<User> {
  return api.put<User>(`/users/${id}/restore`);
}
