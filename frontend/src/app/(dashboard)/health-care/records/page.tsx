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
  createHealthRecord,
  deleteHealthRecord,
  listHealthRecords,
  updateHealthRecord,
  type HealthRecordPayload,
} from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate, todayISO, truncate } from "@/lib/format";
import type { HealthRecord } from "@/lib/types";

interface FormState {
  studentId: string;
  studentName: string;
  checkupDate: string;
  heightCm: string;
  weightKg: string;
  note: string;
}

const emptyForm = (): FormState => ({
  studentId: "",
  studentName: "",
  checkupDate: todayISO(),
  heightCm: "",
  weightKg: "",
  note: "",
});

export default function HealthRecordsPage() {
  const qc = useQueryClient();
  const records = useQuery({ queryKey: ["health-records", undefined], queryFn: () => listHealthRecords() });

  const [modal, setModal] = useState<{ open: boolean; editing?: HealthRecord }>({ open: false });
  const [confirming, setConfirming] = useState<HealthRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  const names = useStudentNames((records.data ?? []).map((record) => record.student_id));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["health-records"] });

  const openCreate = () => {
    setForm(emptyForm());
    setError(null);
    setModal({ open: true });
  };

  const openEdit = (record: HealthRecord) => {
    setForm({
      studentId: record.student_id,
      studentName: names[record.student_id] ?? "",
      checkupDate: record.checkup_date?.slice(0, 10) ?? "",
      heightCm: String(record.height_cm ?? ""),
      weightKg: String(record.weight_kg ?? ""),
      note: record.note ?? "",
    });
    setError(null);
    setModal({ open: true, editing: record });
  };

  const closeModal = () => setModal({ open: false });

  const save = useMutation({
    mutationFn: () => {
      const payload: HealthRecordPayload = {
        student_id: form.studentId,
        checkup_date: form.checkupDate,
        height_cm: Number(form.heightCm),
        weight_kg: Number(form.weightKg),
        note: form.note,
      };
      return modal.editing ? updateHealthRecord(modal.editing.id, payload) : createHealthRecord(payload);
    },
    onSuccess: () => {
      invalidate();
      setError(null);
      closeModal();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được hồ sơ sức khoẻ"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHealthRecord(id),
    onSuccess: () => {
      invalidate();
      setConfirming(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được hồ sơ sức khoẻ"),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal.editing && !form.studentId) return setError("Vui lòng chọn học sinh");
    if (!form.checkupDate) return setError("Vui lòng chọn ngày khám");
    if (!(Number(form.heightCm) > 0) || !(Number(form.weightKg) > 0)) {
      return setError("Chiều cao và cân nặng phải lớn hơn 0");
    }
    if (!form.note.trim()) return setError("Vui lòng nhập ghi chú");
    save.mutate();
  };

  const keyword = search.trim().toLowerCase();
  const rows = (records.data ?? []).filter((record) => {
    if (studentFilter && record.student_id !== studentFilter) return false;
    if (!keyword) return true;
    return (names[record.student_id] ?? "").toLowerCase().includes(keyword) || record.note.toLowerCase().includes(keyword);
  });

  const students = Array.from(new Set((records.data ?? []).map((record) => record.student_id)));

  const columns: Column<HealthRecord>[] = [
    {
      key: "student",
      header: "Học sinh",
      render: (row) => <span className="font-medium text-slate-800">{names[row.student_id] ?? row.student_id}</span>,
    },
    { key: "date", header: "Ngày khám", render: (row) => formatDate(row.checkup_date) },
    { key: "height", header: "Chiều cao", render: (row) => `${row.height_cm} cm` },
    { key: "weight", header: "Cân nặng", render: (row) => `${row.weight_kg} kg` },
    { key: "note", header: "Ghi chú", render: (row) => truncate(row.note, 70) },
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
        title="Hồ sơ sức khoẻ"
        description="Sổ theo dõi chiều cao, cân nặng và ghi chú khám sức khoẻ của học sinh"
        action={<Button onClick={openCreate}>+ Thêm hồ sơ</Button>}
      />

      {error && !modal.open && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Tìm kiếm">
          <Input placeholder="Tên học sinh hoặc ghi chú…" value={search} onChange={(e) => setSearch(e.target.value)} />
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

      {records.isLoading ? (
        <Loading />
      ) : (
        <DataTable columns={columns} rows={rows} emptyTitle="Chưa có hồ sơ sức khoẻ" />
      )}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa hồ sơ sức khoẻ" : "Thêm hồ sơ sức khoẻ"}
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Huỷ
            </Button>
            <Button type="submit" form="health-record-form" loading={save.isPending}>
              {modal.editing ? "Lưu thay đổi" : "Thêm hồ sơ"}
            </Button>
          </>
        }
      >
        <form id="health-record-form" className="space-y-4" onSubmit={submit}>
          {error && <Alert variant="error">{error}</Alert>}
          {modal.editing ? (
            <Field label="Học sinh">
              <Input value={names[modal.editing.student_id] ?? modal.editing.student_id} disabled />
            </Field>
          ) : (
            <StudentPicker
              value={form.studentId}
              onChange={(s) => setForm({ ...form, studentId: s.id, studentName: s.name })}
              required
            />
          )}
          <Field label="Ngày khám" required>
            <Input
              type="date"
              value={form.checkupDate}
              onChange={(e) => setForm({ ...form, checkupDate: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Chiều cao (cm)" required>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              />
            </Field>
            <Field label="Cân nặng (kg)" required>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Ghi chú" required>
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={confirming !== null}
        title="Xoá hồ sơ sức khoẻ"
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
          Bạn có chắc muốn xoá hồ sơ ngày{" "}
          <strong>{formatDate(confirming?.checkup_date)}</strong> của{" "}
          <strong>{confirming ? names[confirming.student_id] ?? confirming.student_id : ""}</strong>? Thao tác này không
          thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
