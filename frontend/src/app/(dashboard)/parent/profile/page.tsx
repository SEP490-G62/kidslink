"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert, Loading } from "@/components/ui/feedback";
import { changePassword, getMe, updateMe } from "@/lib/services/user";
import { useAuth } from "@/lib/auth-store";
import { USER_KEY } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/constants";

interface ProfileForm {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  avatar_url: string;
}

const EMPTY_FORM: ProfileForm = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  avatar_url: "",
};

export default function ParentProfilePage() {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe });

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!me.data) return;
    setForm({
      full_name: me.data.full_name ?? "",
      email: me.data.email ?? "",
      phone_number: me.data.phone_number ?? "",
      address: me.data.address ?? "",
      avatar_url: me.data.avatar_url ?? "",
    });
  }, [me.data]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateMe({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        address: form.address.trim(),
        avatar_url: form.avatar_url.trim(),
      }),
    onSuccess: (user) => {
      setUser(user);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      qc.invalidateQueries({ queryKey: ["me"] });
      setProfileError(null);
      setProfileSuccess("Đã cập nhật hồ sơ.");
    },
    onError: (e) => {
      setProfileSuccess(null);
      setProfileError(e instanceof ApiError ? e.message : "Không cập nhật được hồ sơ");
    },
  });

  const savePassword = useMutation({
    mutationFn: () => {
      if (passwords.new_password.length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
      }
      if (passwords.new_password !== passwords.confirm) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
    },
    onSuccess: () => {
      setPasswords({ current_password: "", new_password: "", confirm: "" });
      setPasswordError(null);
      setPasswordSuccess("Đã đổi mật khẩu.");
    },
    onError: (e) => {
      setPasswordSuccess(null);
      setPasswordError(
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Không đổi được mật khẩu",
      );
    },
  });

  if (me.isLoading) return <Loading label="Đang tải hồ sơ…" />;

  if (me.isError) {
    return (
      <div>
        <PageHeader title="Hồ sơ" />
        <Alert variant="error">{me.error instanceof ApiError ? me.error.message : "Không tải được hồ sơ"}</Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Hồ sơ" description="Cập nhật thông tin cá nhân và mật khẩu đăng nhập" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Thông tin cá nhân" description={me.data ? ROLE_LABEL[me.data.role] : undefined} />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
            >
              {profileError && <Alert variant="error">{profileError}</Alert>}
              {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ và tên" required>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </Field>
                <Field label="Tên đăng nhập">
                  <Input value={me.data?.username ?? ""} disabled />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Số điện thoại">
                  <Input
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </Field>
                <Field label="Địa chỉ" hint="Dùng cho liên hệ của nhà trường">
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Field>
                <Field label="Ảnh đại diện (URL)">
                  <Input
                    value={form.avatar_url}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder="https://…"
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={saveProfile.isPending} disabled={!form.full_name.trim()}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Đổi mật khẩu" description="Bảo mật tài khoản" />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                savePassword.mutate();
              }}
            >
              {passwordError && <Alert variant="error">{passwordError}</Alert>}
              {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

              <Field label="Mật khẩu hiện tại" required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current_password}
                  onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                />
              </Field>
              <Field label="Mật khẩu mới" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                />
              </Field>
              <Field label="Xác nhận mật khẩu mới" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </Field>

              <Button
                type="submit"
                variant="outline"
                loading={savePassword.isPending}
                disabled={!passwords.current_password || !passwords.new_password}
                className="w-full"
              >
                Đổi mật khẩu
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
