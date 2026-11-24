"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { createParent, deleteParent, listParents, listStudents, type ParentWithChildren } from "@/lib/services/school";
import { ApiError } from "@/lib/api";

export default function ParentsPage() {
  const qc = useQueryClient();
  const parents = useQuery({ queryKey: ["parents"], queryFn: listParents });
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createParent({
        full_name: form.fullName,
        username: form.username,
        password: form.password,
        email: form.email,
        phone_number: form.phoneNumber,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      setModal(false);
      setForm({ fullName: "", username: "", password: "", email: "", phoneNumber: "" });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được phụ huynh"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteParent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parents"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được phụ huynh"),
  });

  const columns: Column<ParentWithChildren>[] = [
    {
      key: "name",
      header: "Họ tên",
      render: (r) => <span className="font-medium">{r.user?.full_name ?? "—"}</span>,
    },
    { key: "username", header: "Tài khoản", render: (r) => r.user?.username ?? "—" },
    { key: "email", header: "Email", render: (r) => r.user?.email ?? "—" },
    { key: "phone", header: "Điện thoại", render: (r) => r.user?.phone_number ?? "—" },
    {
      key: "children",
      header: "Con",
      render: (r) => {
        const names = (r.children ?? []).map((c) => c.full_name);
        return names.length ? names.join(", ") : "—";
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <button
          className="text-xs font-medium text-rose-600 hover:underline"
          onClick={() => {
            if (confirm(`Xoá phụ huynh ${r.user?.full_name ?? ""}?`)) remove.mutate(r.id);
          }}
        >
          Xoá
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Phụ huynh"
        description="Tài khoản phụ huynh và liên kết với học sinh"
        action={<Button onClick={() => setModal(true)}>+ Thêm phụ huynh</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {parents.isLoading ? (
        <Loading />
      ) : (
        <DataTable columns={columns} rows={parents.data ?? []} emptyTitle="Chưa có phụ huynh" />
      )}

      <Modal
        open={modal}
        title="Thêm phụ huynh"
        onClose={() => setModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Huỷ
            </Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>
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
            <Field label="Tên đăng nhập" required>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Mật khẩu" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Số điện thoại" required>
            <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-500">
            Sau khi tạo tài khoản, vào mục Học sinh để liên kết phụ huynh với con.
          </p>
        </div>
      </Modal>
    </div>
  );
}
