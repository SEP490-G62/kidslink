"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { ROLE_HOME } from "@/lib/constants";
import type { LoginResponse } from "@/lib/types";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { username: "", password: "" } });

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      const result = await api.post<LoginResponse>("/auth/login", values, { skipAuthRedirect: true });
      login(result.token, result.user);
      router.replace(ROLE_HOME[result.user.role] ?? "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể kết nối máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
      <p className="mt-1 text-sm text-slate-500">Chào mừng trở lại KidsLink</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Field label="Tên đăng nhập" required error={errors.username?.message}>
          <Input
            autoComplete="username"
            autoFocus
            placeholder="ví dụ: schooladmin"
            {...register("username", { required: "Vui lòng nhập tên đăng nhập" })}
          />
        </Field>

        <Field label="Mật khẩu" required error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password", { required: "Vui lòng nhập mật khẩu" })}
          />
        </Field>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Tài khoản demo</p>
        <ul className="mt-2 space-y-1">
          <li>Quản trị trường: <code>schooladmin</code> / <code>Admin@123</code></li>
          <li>Giáo viên: <code>teacher1</code> / <code>Teacher@123</code></li>
          <li>Phụ huynh: <code>parent1</code> / <code>Parent@123</code></li>
          <li>Y tế: <code>nurse1</code> / <code>Nurse@123</code> · Dinh dưỡng: <code>cook1</code> / <code>Cook@123</code></li>
        </ul>
      </div>
    </div>
  );
}
