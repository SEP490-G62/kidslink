/**
 * API client cho KidsLink backend (Spring Boot).
 *
 * - Base URL: NEXT_PUBLIC_API_URL (mặc định http://localhost:8080/api)
 * - Tự động gắn `Authorization: Bearer <token>` từ localStorage
 * - 401 → xoá phiên và điều hướng về /login
 * - Ném ApiError chứa `error` (thông điệp tiếng Việt) và `errors` (field validation)
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws";

export const TOKEN_KEY = "kidslink.token";
export const USER_KEY = "kidslink.user";

export interface FieldError {
  field?: string;
  message: string;
  path?: string;
}

export class ApiError extends Error {
  status: number;
  errors?: FieldError[];
  data?: unknown;

  constructor(status: number, message: string, errors?: FieldError[], data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Bỏ qua tự động redirect khi 401 (dùng cho login/register). */
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipAuthRedirect, ...rest } = options;
  const token = getToken();

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const payload = (data ?? {}) as Record<string, unknown>;
    const message =
      (typeof payload.error === "string" && payload.error) ||
      (typeof payload.message === "string" && payload.message) ||
      `Yêu cầu thất bại (${response.status})`;

    if (response.status === 401 && !skipAuthRedirect && typeof window !== "undefined") {
      setToken(null);
      window.localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    throw new ApiError(response.status, message, payload.errors as FieldError[] | undefined, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** Upload 1 file (multipart/form-data). */
export function uploadFile(file: File): Promise<{ url: string; public_id: string }> {
  const form = new FormData();
  form.append("file", file);
  return api.post<{ url: string; public_id: string }>("/uploads", form);
}

/** Upload nhiều file tuần tự, trả danh sách URL. */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const { url } = await uploadFile(file);
    urls.push(url);
  }
  return urls;
}

export function queryString(params: Record<string, unknown> | object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
