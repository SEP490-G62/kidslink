"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getAttendance, teacherCheckin, teacherCheckout } from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate, todayISO } from "@/lib/format";
import { currentTimeHHmm, normalizeAttendance, type AttendanceStudent } from "@/lib/teacher";

export default function AttendancePage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attendance = useQuery({
    queryKey: ["teacher-attendance", date],
    queryFn: () => getAttendance(date),
    enabled: Boolean(date),
  });

  const data = normalizeAttendance(attendance.data);

  const checkin = useMutation({
    mutationFn: (studentId: string) =>
      teacherCheckin({ student_id: studentId, report_date: date, checkin_time: currentTimeHHmm() }),
    onSuccess: () => {
      setNotice(`Đã điểm danh đến lúc ${currentTimeHHmm()}`);
      setError(null);
      qc.invalidateQueries({ queryKey: ["teacher-attendance", date] });
    },
    onError: (e) => {
      setNotice(null);
      setError(e instanceof ApiError ? e.message : "Không điểm danh được");
    },
  });

  const checkout = useMutation({
    mutationFn: (studentId: string) =>
      teacherCheckout({ student_id: studentId, report_date: date, checkout_time: currentTimeHHmm() }),
    onSuccess: () => {
      setNotice(`Đã điểm danh về lúc ${currentTimeHHmm()}`);
      setError(null);
      qc.invalidateQueries({ queryKey: ["teacher-attendance", date] });
    },
    onError: (e) => {
      setNotice(null);
      setError(e instanceof ApiError ? e.message : "Không điểm danh về được");
    },
  });

  const busyStudentId = checkin.isPending ? checkin.variables : checkout.isPending ? checkout.variables : null;
  const scheduleWarning = !attendance.isLoading && !attendance.isError && data.students.length > 0 && !data.has_schedule;

  const columns: Column<AttendanceStudent>[] = [
    {
      key: "name",
      header: "Học sinh",
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {row.full_name.charAt(0)}
          </span>
          <span className="font-medium text-slate-800">{row.full_name}</span>
        </div>
      ),
    },
    {
      key: "checkin",
      header: "Giờ đến",
      render: (row) =>
        row.has_checkin ? <span className="font-medium text-emerald-700">{row.checkin_time}</span> : "—",
    },
    {
      key: "checkout",
      header: "Giờ về",
      render: (row) =>
        row.has_checkout ? <span className="font-medium text-sky-700">{row.checkout_time}</span> : "—",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size-shape="sm"
            variant="secondary"
            className="px-3 py-1.5"
            disabled={row.has_checkin || busyStudentId === row.id}
            loading={checkin.isPending && checkin.variables === row.id}
            onClick={() => checkin.mutate(row.id)}
          >
            Đến
          </Button>
          <Button
            variant="outline"
            className="px-3 py-1.5"
            disabled={!row.has_checkin || row.has_checkout || busyStudentId === row.id}
            loading={checkout.isPending && checkout.variables === row.id}
            onClick={() => checkout.mutate(row.id)}
          >
            Về
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Điểm danh" description="Điểm danh đến / về của học sinh trong lớp" />

      <div className="mb-6 max-w-xs">
        <Field label="Ngày điểm danh">
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setNotice(null);
              setError(null);
            }}
          />
        </Field>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng học sinh" value={data.total_students} icon="🧒" />
        <StatCard label="Đã đến" value={data.checked_in} icon="✅" />
        <StatCard label="Đã về" value={data.checked_out} icon="🏠" />
        <StatCard label="Tỉ lệ điểm danh" value={`${data.attendance_rate}%`} icon="📊" />
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {notice && !error && (
        <div className="mb-4">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}
      {scheduleWarning && (
        <div className="mb-4">
          <Alert>Lớp không có lịch học ngày {formatDate(date)} — điểm danh có thể bị từ chối.</Alert>
        </div>
      )}

      <Card>
        <CardHeader
          title="Danh sách điểm danh"
          description={data.class_name ? `Lớp ${data.class_name} · ${formatDate(date)}` : formatDate(date)}
        />
        <CardBody>
          {attendance.isLoading ? (
            <Loading label="Đang tải điểm danh…" />
          ) : attendance.isError ? (
            <Alert variant="error">
              {attendance.error instanceof ApiError ? attendance.error.message : "Không tải được dữ liệu điểm danh"}
            </Alert>
          ) : data.students.length === 0 ? (
            <EmptyState title="Không có học sinh" description="Lớp chưa được xếp học sinh." />
          ) : (
            <DataTable columns={columns} rows={data.students} emptyTitle="Không có học sinh" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
