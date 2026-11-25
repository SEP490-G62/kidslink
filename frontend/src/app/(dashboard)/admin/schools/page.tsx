"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { createSchool, deleteSchool, listSchools, updateSchool, updateSchoolStatus } from "@/lib/services/school";
import { ApiError } from "@/lib/api";
import type { School } from "@/lib/types";

const EMPTY = { school_name: "", address: "", phone: "", email: "", logo_url: "" };

export default function AdminSchoolsPage() {
  const qc = useQueryClient();
  const schools = useQuery({ queryKey: ["admin-schools"], queryFn: listSchools });

  const [modal, setModal] = useState<{ open: boolean; editing?: School }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-schools"] });

  const save = useMutation({
    mutationFn: () => (modal.editing ? updateSchool(modal.editing.id, form) : createSchool(form)),
    onSuccess: () => {
      invalidate();
      setModal({ open: false });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được thông tin trường"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => updateSchoolStatus(id, status),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không đổi được trạng thái"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSchool(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được trường"),
  });

  const columns: Column<School>[] = [
    { key: "name", header: "Tên trường", render: (r) => <span className="font-medium">{r.school_name}</span> },
    { key: "address", header: "Địa chỉ", render: (r) => <span className="text-slate-600">{r.address}</span> },
    { key: "phone", header: "Điện thoại", render: (r) => r.phone || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {r.status === 1 ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-3">
          <button
            className="text-xs font-medium text-indigo-600 hover:underline"
            onClick={() => {
              setForm({
                school_name: r.school_name,
                address: r.address,
                phone: r.phone ?? "",
                email: r.email ?? "",
                logo_url: r.logo_url ?? "",
              });
              setError(null);
              setModal({ open: true, editing: r });
            }}
          >
            Sửa
          </button>
          <button
            className="text-xs font-medium text-amber-600 hover:underline"
            onClick={() => toggle.mutate({ id: r.id, status: r.status === 1 ? 0 : 1 })}
          >
            {r.status === 1 ? "Tạm dừng" : "Kích hoạt"}
          </button>
          <button
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => {
              if (confirm(`Xoá trường ${r.school_name}?`)) remove.mutate(r.id);
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
        title="Trường học"
        description="Quản lý toàn bộ trường trong hệ thống"
        action={
          <Button
            onClick={() => {
              setForm(EMPTY);
              setError(null);
              setModal({ open: true });
            }}
          >
            + Thêm trường
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {schools.isLoading ? <Loading /> : <DataTable columns={columns} rows={schools.data ?? []} emptyTitle="Chưa có trường học" />}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa thông tin trường" : "Thêm trường học"}
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
          <Field label="Tên trường" required>
            <Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
          </Field>
          <Field label="Địa chỉ" required>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Điện thoại">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Logo (URL)">
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
