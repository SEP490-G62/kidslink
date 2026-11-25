"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { StudentPicker, useStudentNames } from "@/components/health/student-picker";
import {
  createHealthNotice,
  deleteHealthNotice,
  listHealthNotices,
  updateHealthNotice,
  type HealthNoticePayload,
} from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate, formatDateTime, todayISO, truncate } from "@/lib/format";
import type { HealthNotice } from "@/lib/types";

interface FormState {
  studentId: string;
  symptoms: string;
  actionsTaken: string;
  medications: string;
  noticeTime: string;
  note: string;
}

const emptyForm = (): FormState => ({
  studentId: "",
  symptoms: "",
  actionsTaken: "",
  medications: "",
  noticeTime: todayISO(),
  note: "",
});

export default function HealthNoticesPage() {
  const qc = useQueryClient();
  const notices = useQuery({ queryKey: ["health-notices", undefined], queryFn: () => listHealthNotices() });

  const [modal, setModal] = useState<{ open: boolean; editing?: HealthNotice }>({ open: false });
  const [confirming, setConfirming] = useState<HealthNotice | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  const names = useStudentNames((notices.data ?? []).map((notice) => notice.student_id));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["health-notices"] });

  const openCreate = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ open: true });
  };

  const openEdit = (notice: HealthNotice) => {
    setForm({
      studentId: notice.student_id,
      symptoms: notice.symptoms ?? "",
      actionsTaken: notice.actions_taken ?? "",
      medications: notice.medications ?? "",
      noticeTime: notice.notice_time?.slice(0, 10) ?? "",
      note: notice.note ?? "",
    });
    setError(null);
    setModal({ open: true, editing: notice });
  };

  const save = useMutation({
    mutationFn: () => {
      const payload: HealthNoticePayload = {
        student_id: form.studentId,
        symptoms: form.symptoms,
        actions_taken: form.actionsTaken,
        medications: form.medications,
        notice_time: form.noticeTime,
        note: form.note,
      };
      return modal.editing ? updateHealthNotice(modal.editing.id, payload) : createHealthNotice(payload);
    },
    onSuccess: () => {
      invalidate();
      setError(null);
      setModal({ open: false });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được thông báo sức khoẻ"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHealthNotice(id),
    onSuccess: () => {
      invalidate();
      setConfirming(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được thông báo sức khoẻ"),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal.editing && !form.studentId) return setError("Vui lòng chọn học sinh");
    if (!form.noticeTime) return setError("Vui lòng chọn ngày ghi nhận");
    if (!form.symptoms.trim()) return setError("Vui lòng nhập triệu chứng");
    if (!form.actionsTaken.trim()) return setError("Vui lòng nhập biện pháp xử lý");
    if (!form.medications.trim()) return setError('Vui lòng nhập thông tin thuốc (hoặc "Không")');
    if (!form.note.trim()) return setError("Vui lòng nhập ghi chú");
    save.mutate();
  };

  const keyword = search.trim().toLowerCase();
  const rows = (notices.data ?? []).filter((notice) => {
    if (studentFilter && notice.student_id !== studentFilter) return false;
    if (!keyword) return true;
    const haystack = [names[notice.student_id], notice.symptoms, notice.actions_taken, notice.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(keyword);
  });

  const students = Array.from(new Set((notices.data ?? []).map((notice) => notice.student_id)));

  const columns: Column<HealthNotice>[] = [
    {
      key: "student",
      header: "Học sinh",
      render: (row) => <span className="font-medium text-slate-800">{names[row.student_id] ?? row.student_id}</span>,
    },
    { key: "date", header: "Ngày ghi nhận", render: (row) => formatDate(row.notice_time) },
    { key: "symptoms", header: "Triệu chứng", render: (row) => truncate(row.symptoms, 50) },
    { key: "actions", header: "Xử lý", render: (row) => truncate(row.actions_taken, 50) },
    { key: "medications", header: "Thuốc", render: (row) => truncate(row.medications, 30) },
    { key: "created", header: "Tạo lúc", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => setConfirming(row)}>
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Thông báo sức khoẻ"
        description="Ghi nhận triệu chứng, cách xử lý và thuốc đã dùng cho từng học sinh"
        action={<Button onClick={openCreate}>+ Thêm thông báo</Button>}
      />

      {error && !modal.open && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Tìm kiếm">
          <Input
            placeholder="Triệu chứng, ghi chú hoặc tên học sinh…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Học sinh">
          <Select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}>
            <option value="">Tất cả học sinh</option>
            {students.map((id) => (
              <option key={id} value={id}>
                {names[id] ?? id}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {notices.isLoading ? (
        <Loading />
      ) : (
        <DataTable columns={columns} rows={rows} emptyTitle="Chưa có thông báo sức khoẻ" />
      )}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa thông báo sức khoẻ" : "Thêm thông báo sức khoẻ"}
        onClose={() => setModal({ open: false })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false })}>
              Huỷ
            </Button>
            <Button type="submit" form="health-notice-form" loading={save.isPending}>
              {modal.editing ? "Lưu thay đổi" : "Thêm thông báo"}
            </Button>
          </>
        }
      >
        <form id="health-notice-form" className="space-y-4" onSubmit={submit}>
          {error && <Alert variant="error">{error}</Alert>}
          {modal.editing ? (
            <Field label="Học sinh">
              <Input value={names[modal.editing.student_id] ?? modal.editing.student_id} disabled />
            </Field>
          ) : (
            <StudentPicker value={form.studentId} onChange={(s) => setForm({ ...form, studentId: s.id })} required />
          )}
          <Field label="Ngày ghi nhận" required>
            <Input
              type="date"
              value={form.noticeTime}
              onChange={(e) => setForm({ ...form, noticeTime: e.target.value })}
            />
          </Field>
          <Field label="Triệu chứng" required>
            <Textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
          </Field>
          <Field label="Biện pháp xử lý" required>
            <Textarea value={form.actionsTaken} onChange={(e) => setForm({ ...form, actionsTaken: e.target.value })} />
          </Field>
          <Field label="Thuốc đã dùng" required hint='Nhập "Không" nếu không dùng thuốc'>
            <Input value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} />
          </Field>
          <Field label="Ghi chú" required>
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={confirming !== null}
        title="Xoá thông báo sức khoẻ"
        onClose={() => setConfirming(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => confirming && remove.mutate(confirming.id)}
            >
              Xoá
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Xoá thông báo ngày <strong>{formatDate(confirming?.notice_time)}</strong> của{" "}
          <strong>{confirming ? names[confirming.student_id] ?? confirming.student_id : ""}</strong>?
        </p>
      </Modal>
    </div>
  );
}
