"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import {
  createUser,
  deleteUser,
  hardDeleteUser,
  listUsers,
  restoreUser,
  updateUser,
  type UserPage,
} from "@/lib/services/user";
import { ApiError } from "@/lib/api";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { User } from "@/lib/types";

const EMPTY = {
  full_name: "",
  username: "",
  password: "",
  role: "teacher" as Role,
  email: "",
  phone_number: "",
  avatar_url: "",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState({ q: "", role: "" });
  const users = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => listUsers({ q: query.q || undefined, role: query.role || undefined, size: 200 }),
  });

  const [modal, setModal] = useState<{ open: boolean; editing?: User }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo<User[]>(() => {
    const raw = users.data;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (raw as UserPage).items;
  }, [users.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const save = useMutation({
    mutationFn: () => {
      if (modal.editing) {
        return updateUser(modal.editing.id, {
          full_name: form.full_name,
          email: form.email,
          phone_number: form.phone_number,
          avatar_url: form.avatar_url,
          role: form.role,
        } as unknown as Partial<User>);
      }
      return createUser({
        full_name: form.full_name,
        username: form.username,
        password: form.password,
        role: form.role,
        email: form.email,
        phone_number: form.phone_number,
        avatar_url: form.avatar_url,
      } as unknown as Partial<User> & { password?: string });
    },
    onSuccess: () => {
      invalidate();
      setModal({ open: false });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được người dùng"),
  });

  const softDelete = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không vô hiệu hoá được"),
  });

  const restore = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không khôi phục được"),
  });

  const hardDelete = useMutation({
    mutationFn: (id: string) => hardDeleteUser(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được"),
  });

  const columns: Column<User>[] = [
    { key: "name", header: "Họ tên", render: (r) => <span className="font-medium">{r.full_name}</span> },
    { key: "username", header: "Tài khoản", render: (r) => r.username },
    { key: "role", header: "Vai trò", render: (r) => ROLE_LABEL[r.role] ?? r.role },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    { key: "phone", header: "Điện thoại", render: (r) => r.phone_number || "—" },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {r.status === 1 ? "Hoạt động" : "Đã khoá"}
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
                full_name: r.full_name,
                username: r.username,
                password: "",
                role: r.role,
                email: r.email ?? "",
                phone_number: r.phone_number ?? "",
                avatar_url: r.avatar_url ?? "",
              });
              setError(null);
              setModal({ open: true, editing: r });
            }}
          >
            Sửa
          </button>
          {r.status === 1 ? (
            <button
              className="text-xs font-medium text-amber-600 hover:underline"
              onClick={() => softDelete.mutate(r.id)}
            >
              Khoá
            </button>
          ) : (
            <button className="text-xs font-medium text-emerald-600 hover:underline" onClick={() => restore.mutate(r.id)}>
              Khôi phục
            </button>
          )}
          <button
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => {
              if (confirm(`Xoá vĩnh viễn ${r.full_name}?`)) hardDelete.mutate(r.id);
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
        title="Người dùng"
        description="Quản lý tài khoản toàn hệ thống"
        action={
          <Button
            onClick={() => {
              setForm(EMPTY);
              setError(null);
              setModal({ open: true });
            }}
          >
            + Thêm người dùng
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 sm:max-w-xl">
        <Input
          placeholder="Tìm theo tên, tài khoản, email…"
          value={query.q}
          onChange={(e) => setQuery({ ...query, q: e.target.value })}
        />
        <Select value={query.role} onChange={(e) => setQuery({ ...query, role: e.target.value })}>
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {users.isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} emptyTitle="Không có người dùng nào" />}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa người dùng" : "Thêm người dùng"}
        onClose={() => setModal({ open: false })}
        wide
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Họ tên" required>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Tên đăng nhập" required>
              <Input
                disabled={Boolean(modal.editing)}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </Field>
          </div>
          {!modal.editing && (
            <Field label="Mật khẩu" hint="Để trống sẽ dùng mật khẩu mặc định Kidslink@123">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vai trò" required>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </Field>
            <Field label="Ảnh đại diện (URL)">
              <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
