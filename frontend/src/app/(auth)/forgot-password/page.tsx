"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/lib/api";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await api.post<{ message?: string }>(
        "/auth/forgot-password",
        { email },
        { skipAuthRedirect: true },
      );
      setSuccess(result.message ?? "Đã gửi mật khẩu mới tới email của bạn");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể kết nối máy chủ.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h2>
      <p className="mt-1 text-sm text-slate-500">
        Nhập email đã đăng ký, chúng tôi sẽ gửi mật khẩu mới cho bạn.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="ban@example.com"
            {...register("email", {
              required: "Vui lòng nhập email",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" },
            })}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Gửi mật khẩu mới
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
