"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { createStudent, deleteStudent, listClasses, listStudents, updateStudent, updateStudentStatus } from "@/lib/services/school";
import { ApiError } from "@/lib/api";
import { formatDate, formatGender } from "@/lib/format";
import type { Student } from "@/lib/types";

const emptyForm = { fullName: "", dob: "", gender: 0, allergy: "", classId: "" };

export default function StudentsPage() {
  const qc = useQueryClient();
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });

  const [modal, setModal] = useState<{ open: boolean; editing?: Student }>({ open: false });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["students"] });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        full_name: form.fullName,
        dob: form.dob,
        gender: Number(form.gender),
        allergy: form.allergy,
      } as unknown as Partial<Student>;
      return modal.editing ? updateStudent(modal.editing.id, payload) : createStudent(payload);
    },
    onSuccess: () => {
      invalidate();
      setModal({ open: false });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được học sinh"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được học sinh"),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => updateStudentStatus(id, status),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không cập nhật được trạng thái"),
  });

  const rows = (students.data ?? []).filter((s) =>
    search ? s.full_name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const columns: Column<Student>[] = [
    { key: "name", header: "Họ tên", render: (r) => <span className="font-medium">{r.full_name}</span> },
    { key: "dob", header: "Ngày sinh", render: (r) => formatDate(r.dob) },
    { key: "gender", header: "Giới tính", render: (r) => formatGender(r.gender) },
    { key: "class", header: "Lớp", render: (r) => r.class_name ?? classes.data?.find((c) => c.id === r.class_id)?.class_name ?? "—" },
    { key: "allergy", header: "Dị ứng", render: (r) => r.allergy || "—" },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {r.status === 1 ? "Đang học" : "Nghỉ"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button
            className="text-xs font-medium text-indigo-600 hover:underline"
            onClick={() => {
              setForm({
                fullName: r.full_name,
                dob: r.dob ?? "",
                gender: r.gender,
                allergy: r.allergy ?? "",
                classId: "",
              });
              setError(null);
              setModal({ open: true, editing: r });
            }}
          >
            Sửa
          </button>
          <button
            className="text-xs font-medium text-amber-600 hover:underline"
            onClick={() => toggleStatus.mutate({ id: r.id, status: r.status === 1 ? 0 : 1 })}
          >
            {r.status === 1 ? "Cho nghỉ" : "Kích hoạt"}
          </button>
          <button
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => {
              if (confirm(`Xoá học sinh ${r.full_name}?`)) remove.mutate(r.id);
            }}
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Học sinh"
        description="Danh sách học sinh toàn trường"
        action={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setError(null);
              setModal({ open: true });
            }}
          >
            + Thêm học sinh
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <Input placeholder="Tìm theo tên…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {students.isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyTitle="Chưa có học sinh" />}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa học sinh" : "Thêm học sinh"}
        onClose={() => setModal({ open: false })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false })}>
              Huỷ
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Họ tên" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ngày sinh" required>
              <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Giới tính" required>
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: Number(e.target.value) })}>
                <option value={0}>Nam</option>
                <option value={1}>Nữ</option>
              </Select>
            </Field>
          </div>
          <Field label="Dị ứng / lưu ý dinh dưỡng">
            <Textarea
              value={form.allergy}
              placeholder="Ví dụ: dị ứng hải sản, không ăn trứng…"
              onChange={(e) => setForm({ ...form, allergy: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
