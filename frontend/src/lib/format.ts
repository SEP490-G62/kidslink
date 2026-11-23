import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0 ₫";
  const amount = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(amount)) return "0 ₫";
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

export function formatDate(value: string | number | Date | null | undefined, pattern = "dd/MM/yyyy"): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  return formatDate(value, "dd/MM/yyyy HH:mm");
}

export function formatRelative(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
}

export function formatGender(gender: number | null | undefined): string {
  if (gender === 0) return "Nam";
  if (gender === 1) return "Nữ";
  return "—";
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function truncate(text: string | null | undefined, length = 80): string {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
