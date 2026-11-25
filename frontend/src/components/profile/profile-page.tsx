"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert, Loading } from "@/components/ui/feedback";
import { ApiError } from "@/lib/api";
import { changePassword, getMe, updateMe } from "@/lib/services/user";
import { useAuth } from "@/lib/auth-store";
import { ROLE_LABEL } from "@/lib/constants";

/**
 * Hồ sơ cá nhân dùng chung cho các dashboard staff (y tế, dinh dưỡng).
 * Đọc/ghi qua `/users/me` + `/users/change-password`, đồng bộ lại auth store sau khi lưu.
 */
export function ProfilePage({
  title = "Hồ sơ cá nhân",
  description = "Cập nhật thông tin liên hệ và mật khẩu đăng nhập",
}: {
  title?: string;
  description?: string;
}) {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe });

  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", avatarUrl: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!me.data) return;
    setForm({
      fullName: me.data.full_name ?? "",
      email: me.data.email ?? "",
      phoneNumber: me.data.phone_number ?? "",
      avatarUrl: me.data.avatar_url ?? "",
    });
  }, [me.data]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateMe({
        full_name: form.fullName,
        email: form.email,
        phone_number: form.phoneNumber,
        avatar_url: form.avatarUrl,
      } as Parameters<typeof updateMe>[0]),
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries({ queryKey: ["me"] });
      setProfileError(null);
      setProfileSaved("Đã lưu hồ sơ");
    },
    onError: (e) => {
      setProfileSaved(null);
      setProfileError(e instanceof ApiError ? e.message : "Không lưu được hồ sơ");
    },
  });

  const savePassword = useMutation({
    mutationFn: () => changePassword({ current_password: passwords.current, new_password: passwords.next }),
    onSuccess: () => {
      setPasswordError(null);
      setPasswordSaved("Đã đổi mật khẩu");
      setPasswords({ current: "", next: "", confirm: "" });
    },
    onError: (e) => {
      setPasswordSaved(null);
      setPasswordError(e instanceof ApiError ? e.message : "Không đổi được mật khẩu");
    },
  });

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName.trim()) {
      setProfileError("Họ tên không được để trống");
      return;
    }
    saveProfile.mutate();
  };

  const submitPassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwords.current || !passwords.next) {
      setPasswordError("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới");
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }
    savePassword.mutate();
  };

  if (me.isLoading) return <Loading />;
  if (me.isError) {
    return <Alert variant="error">{me.error instanceof ApiError ? me.error.message : "Không tải được hồ sơ"}</Alert>;
  }

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Thông tin cá nhân" description={me.data ? ROLE_LABEL[me.data.role] : undefined} />
          <CardBody>
            <form className="space-y-4" onSubmit={submitProfile}>
              {profileError && <Alert variant="error">{profileError}</Alert>}
              {profileSaved && <Alert variant="success">{profileSaved}</Alert>}
              <Field label="Tên đăng nhập">
                <Input value={me.data?.username ?? ""} disabled />
              </Field>
              <Field label="Họ và tên" required>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Số điện thoại">
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </Field>
              <Field label="Ảnh đại diện (URL)">
                <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" loading={saveProfile.isPending}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Đổi mật khẩu" description="Tối thiểu 6 ký tự" />
          <CardBody>
            <form className="space-y-4" onSubmit={submitPassword}>
              {passwordError && <Alert variant="error">{passwordError}</Alert>}
              {passwordSaved && <Alert variant="success">{passwordSaved}</Alert>}
              <Field label="Mật khẩu hiện tại" required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
              </Field>
              <Field label="Mật khẩu mới" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
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
              <div className="flex justify-end">
                <Button type="submit" variant="outline" loading={savePassword.isPending}>
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
