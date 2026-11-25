"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { getClassStudents, teacherUpdateComment, weeklyReports } from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { normalizeTeacherStudents, readTeacherStudent, type TeacherStudent } from "@/lib/teacher";
import type { DailyReport } from "@/lib/types";

export default function TeacherDailyReportsPage() {
  const qc = useQueryClient();
  const students = useQuery({ queryKey: ["teacher-class-students"], queryFn: getClassStudents });
  const roster = useMemo(() => normalizeTeacherStudents(students.data).students, [students.data]);

  const [studentId, setStudentId] = useState("");
  const activeId = studentId || roster[0]?.id || "";

  const reports = useQuery({
    queryKey: ["teacher-weekly-reports", activeId],
    queryFn: () => weeklyReports(activeId),
    enabled: Boolean(activeId),
  });

  const [editing, setEditing] = useState<DailyReport | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => teacherUpdateComment(editing?.id ?? "", comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-weekly-reports", activeId] });
      setEditing(null);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được nhận xét"),
  });

  const rows = useMemo(() => {
    const raw = reports.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is DailyReport => typeof item === "object" && item !== null);
  }, [reports.data]);

  const activeStudent: TeacherStudent | null = roster.find((s) => s.id === activeId) ?? null;

  const columns: Column<DailyReport>[] = [
    { key: "date", header: "Ngày", render: (r) => formatDate(r.report_date) },
    { key: "in", header: "Giờ đến", render: (r) => r.checkin_time ?? "—" },
    { key: "out", header: "Giờ về", render: (r) => r.checkout_time ?? "—" },
    {
      key: "comment",
      header: "Nhận xét",
      render: (r) => <span className="text-slate-600">{r.comments || "—"}</span>,
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (r) => (
        <button
          className="text-xs font-medium text-indigo-600 hover:underline"
          onClick={() => {
            setEditing(r);
            setComment(r.comments ?? "");
            setError(null);
          }}
        >
          Sửa nhận xét
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Báo cáo ngày" description="Điểm danh và ghi nhận xét cho học sinh của lớp" />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Học sinh">
              <Select value={activeId} onChange={(e) => setStudentId(e.target.value)}>
                {roster.length === 0 && <option value="">Chưa có học sinh</option>}
                {roster.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end text-sm text-slate-600">
              {activeStudent ? (
                <span>
                  Thông tin: <span className="font-medium text-slate-800">{activeStudent.full_name}</span>
                  {activeStudent.allergy ? ` · Dị ứng: ${activeStudent.allergy}` : ""}
                </span>
              ) : (
                <span>Chọn học sinh để xem báo cáo</span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Báo cáo 7 ngày gần nhất" />
        <CardBody>
          {reports.isLoading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState title="Chưa có báo cáo" description="Báo cáo xuất hiện sau khi giáo viên điểm danh." />
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(editing)}
        title="Nhận xét báo cáo ngày"
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {activeStudent?.full_name} · {formatDate(editing?.report_date)}
          </p>
          <Field label="Nhận xét">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Hôm nay con ăn ngoan, ngủ đủ giấc…" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
