"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { EmptyState } from "./feedback";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle = "Chưa có dữ liệu",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(onRowClick && "cursor-pointer hover:bg-slate-50")}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx("px-4 py-3 text-slate-700", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Đọc danh sách trả về từ API dạng `{ items }` (có phân trang) hoặc mảng thuần,
 * trả về phần tử và tổng số bản ghi của một response có hai dạng.
 */
export function unwrapItems<T>(data: T[] | { items: T[]; total?: number } | undefined): {
  items: T[];
  total: number;
} {
  if (!data) return { items: [], total: 0 };
  if (Array.isArray(data)) return { items: data, total: data.length };
  const items = Array.isArray(data.items) ? data.items : [];
  return { items, total: typeof data.total === "number" ? data.total : items.length };
}
