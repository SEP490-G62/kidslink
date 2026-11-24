"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import {
  createClass,
  createClassAge,
  deleteClass,
  listClassAges,
  listClasses,
  updateClass,
} from "@/lib/services/school";
import type { ClassAge, SchoolClass } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function ClassesPage() {
  const qc = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const ages = useQuery({ queryKey: ["class-ages"], queryFn: listClassAges });

  const [classModal, setClassModal] = useState<{ open: boolean; editing?: SchoolClass }>({ open: false });
  const [ageModal, setAgeModal] = useState(false);
  const [form, setForm] = useState({
    className: "",
    academicYear: "2025-2026",
    classAgeId: "",
    startDate: "",
    endDate: "",
  });
  const [ageForm, setAgeForm] = useState({ age: 3, ageName: "" });
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["classes"] });
    qc.invalidateQueries({ queryKey: ["class-ages"] });
  };

  const saveClass = useMutation({
    mutationFn: () =>
      classModal.editing
        ? updateClass(classModal.editing.id, {
            class_name: form.className,
            academic_year: form.academicYear,
            class_age_id: form.classAgeId,
            start_date: form.startDate,
            end_date: form.endDate,
          } as unknown as Partial<SchoolClass>)
        : createClass({
            class_name: form.className,
            academic_year: form.academicYear,
            class_age_id: form.classAgeId,
            start_date: form.startDate,
            end_date: form.endDate,
          } as unknown as Partial<SchoolClass>),
    onSuccess: () => {
      invalidate();
      setClassModal({ open: false });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được lớp học"),
  });

  const removeClass = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được lớp"),
  });

  const saveAge = useMutation({
    mutationFn: () => createClassAge({ age: ageForm.age, age_name: ageForm.ageName }),
    onSuccess: () => {
      invalidate();
      setAgeModal(false);
      setAgeForm({ age: 3, ageName: "" });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được nhóm tuổi"),
  });

  const openCreate = () => {
    setForm({
      className: "",
      academicYear: "2025-2026",
      classAgeId: ages.data?.[0]?.id ?? "",
      startDate: "2025-09-05",
      endDate: "2026-05-30",
    });
    setError(null);
    setClassModal({ open: true });
  };

  const openEdit = (cls: SchoolClass) => {
    setForm({
      className: cls.class_name,
      academicYear: cls.academic_year,
      classAgeId: cls.class_age_id,
      startDate: cls.start_date,
      endDate: cls.end_date,
    });
    setError(null);
    setClassModal({ open: true, editing: cls });
  };

  const columns: Column<SchoolClass>[] = [
    { key: "name", header: "Tên lớp", render: (r) => <span className="font-medium">{r.class_name}</span> },
    { key: "year", header: "Năm học", render: (r) => r.academic_year },
    {
      key: "age",
      header: "Nhóm tuổi",
      render: (r) => ages.data?.find((a) => a.id === r.class_age_id)?.age_name ?? "—",
    },
    { key: "count", header: "Học sinh", render: (r) => r.student_count ?? 0 },
    { key: "start", header: "Bắt đầu", render: (r) => formatDate(r.start_date) },
    { key: "end", header: "Kết thúc", render: (r) => formatDate(r.end_date) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => openEdit(r)}>
            Sửa
          </button>
          <button
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => {
              if (confirm(`Xoá lớp ${r.class_name}?`)) removeClass.mutate(r.id);
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
        title="Lớp học"
        description="Quản lý lớp, nhóm tuổi và phân công giáo viên"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAgeModal(true)}>
              + Nhóm tuổi
            </Button>
            <Button onClick={openCreate}>+ Thêm lớp</Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(ages.data ?? []).map((a: ClassAge) => (
          <span key={a.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {a.age_name}
          </span>
        ))}
      </div>

      {classes.isLoading ? <Loading /> : <DataTable columns={columns} rows={classes.data ?? []} emptyTitle="Chưa có lớp học" />}

      <Modal
        open={classModal.open}
        title={classModal.editing ? "Sửa lớp học" : "Thêm lớp học"}
        onClose={() => setClassModal({ open: false })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setClassModal({ open: false })}>
              Huỷ
            </Button>
            <Button loading={saveClass.isPending} onClick={() => saveClass.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên lớp" required>
            <Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
          </Field>
          <Field label="Năm học" required>
            <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
          </Field>
          <Field label="Nhóm tuổi" required>
            <Select value={form.classAgeId} onChange={(e) => setForm({ ...form, classAgeId: e.target.value })}>
              <option value="">— Chọn nhóm tuổi —</option>
              {(ages.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.age_name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Ngày kết thúc">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={ageModal}
        title="Thêm nhóm tuổi"
        onClose={() => setAgeModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAgeModal(false)}>
              Huỷ
            </Button>
            <Button loading={saveAge.isPending} onClick={() => saveAge.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Độ tuổi" required>
            <Input
              type="number"
              value={ageForm.age}
              onChange={(e) => setAgeForm({ ...ageForm, age: Number(e.target.value) })}
            />
          </Field>
          <Field label="Tên nhóm" required>
            <Input
              placeholder="Nhóm 3 tuổi"
              value={ageForm.ageName}
              onChange={(e) => setAgeForm({ ...ageForm, ageName: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
