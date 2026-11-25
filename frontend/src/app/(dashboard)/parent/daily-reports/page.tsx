"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { DataTable, type Column } from "@/components/ui/table";
import { getChildren } from "@/lib/services/content";
import { parentDailyReports } from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { addDays, format, parseISO } from "date-fns";
import type { DailyReport } from "@/lib/types";

/** The report window is fixed to the last 7 days (today included). */
function lastSevenDays() {
  const today = new Date();
  return {
    to: format(today, "yyyy-MM-dd"),
    from: format(addDays(today, -6), "yyyy-MM-dd"),
  };
}

function toISODate(value: string): string | null {
  if (!value) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : format(date, "yyyy-MM-dd");
}

const columns: Column<DailyReport>[] = [
  {
    key: "date",
    header: "Ngày",
    render: (row) => <span className="font-medium text-slate-800">{formatDate(row.report_date)}</span>,
  },
  {
    key: "checkin",
    header: "Giờ đến",
    render: (row) => row.checkin_time || <span className="text-slate-400">—</span>,
  },
  {
    key: "checkout",
    header: "Giờ về",
    render: (row) => row.checkout_time || <span className="text-slate-400">—</span>,
  },
  {
    key: "comments",
    header: "Nhận xét",
    render: (row) =>
      row.comments ? <span className="whitespace-pre-line">{row.comments}</span> : <span className="text-slate-400">—</span>,
  },
];

export default function DailyReportsPage() {
  const children = useQuery({ queryKey: ["parent-children"], queryFn: getChildren });
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState(() => lastSevenDays().from);
  const [to, setTo] = useState(() => lastSevenDays().to);

  const activeId = studentId || children.data?.[0]?.id || "";

  const reports = useQuery({
    queryKey: ["parent-daily-reports", activeId, from, to],
    queryFn: () => parentDailyReports(activeId, toISODate(from) ?? undefined, toISODate(to) ?? undefined),
    enabled: Boolean(activeId && from && to),
  });

  const child = children.data?.find((c) => c.id === activeId);
  const sorted = [...(reports.data ?? [])].sort((a, b) => b.report_date.localeCompare(a.report_date));

  return (
    <div>
      <PageHeader
        title="Báo cáo ngày"
        description={child ? `Báo cáo điểm danh và nhận xét của ${child.full_name}` : "Báo cáo điểm danh hằng ngày của con"}
      />

      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Chọn con">
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                value={activeId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                {(children.data ?? []).length === 0 && <option value="">Chưa có thông tin con</option>}
                {(children.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                    {c.class_name ?? c.school_class?.class_name ? ` – ${c.class_name ?? c.school_class?.class_name}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Từ ngày" hint="Mặc định 7 ngày gần nhất">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Đến ngày">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                const range = lastSevenDays();
                setFrom(range.from);
                setTo(range.to);
              }}
            >
              7 ngày gần nhất
            </Button>
          </div>
        </CardBody>
      </Card>

      {children.isError && (
        <div className="mb-4">
          <Alert variant="error">Không tải được danh sách con</Alert>
        </div>
      )}

      {reports.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {reports.error instanceof ApiError ? reports.error.message : "Không tải được báo cáo ngày"}
          </Alert>
        </div>
      )}

      {children.isLoading || reports.isLoading ? (
        <Loading label="Đang tải báo cáo…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="Chưa có báo cáo nào" description="Không có báo cáo trong khoảng thời gian đã chọn." />
      ) : (
        <DataTable columns={columns} rows={sorted} emptyTitle="Chưa có báo cáo nào" />
      )}

      {sorted.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Tóm tắt" />
          <CardBody>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Số ngày có báo cáo</p>
                <p className="text-lg font-semibold text-slate-900">{sorted.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Số ngày đi học có giờ đến</p>
                <p className="text-lg font-semibold text-slate-900">
                  {sorted.filter((r) => r.checkin_time).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Số ngày có nhận xét</p>
                <p className="text-lg font-semibold text-slate-900">
                  {sorted.filter((r) => r.comments?.trim()).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
