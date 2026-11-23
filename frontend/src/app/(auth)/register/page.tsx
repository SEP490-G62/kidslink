"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/constants";
import type { LoginResponse } from "@/lib/types";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

interface RegisterForm {
  full_name: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: Role;
  email: string;
  phone_number: string;
}

const REGISTER_ROLES: Role[] = ["school_admin", "teacher", "parent", "health_care_staff", "nutrition_staff"];

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
const PHONE_RULE = /^(\+84|0)(3|5|7|8|9)\d{8}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { role: "parent" } });

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    setServerErrors({});
    try {
      const { confirmPassword: _confirmPassword, ...payload } = values;
      const result = await api.post<LoginResponse>("/auth/register", payload, { skipAuthRedirect: true });
      login(result.token, result.user);
      router.replace(ROLE_HOME[result.user.role] ?? "/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.length) {
          const mapped: Record<string, string> = {};
          for (const item of err.errors) {
            if (item.field) mapped[item.field] = item.message;
          }
          setServerErrors(mapped);
        }
        setError(err.message);
      } else {
        setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h2>
      <p className="mt-1 text-sm text-slate-500">Điền thông tin để tham gia KidsLink</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Field label="Họ và tên" required error={errors.full_name?.message ?? serverErrors.full_name}>
          <Input
            placeholder="Nguyễn Văn A"
            {...register("full_name", { required: "Vui lòng nhập họ tên" })}
          />
        </Field>

        <Field label="Tên đăng nhập" required error={errors.username?.message ?? serverErrors.username}>
          <Input
            autoComplete="username"
            placeholder="nguyenvana"
            {...register("username", { required: "Vui lòng nhập tên đăng nhập" })}
          />
        </Field>

        <Field label="Vai trò" required error={errors.role?.message ?? serverErrors.role}>
          <Select {...register("role", { required: "Vui lòng chọn vai trò" })}>
            {REGISTER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Email" required error={errors.email?.message ?? serverErrors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            {...register("email", {
              required: "Vui lòng nhập email",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" },
            })}
          />
        </Field>

        <Field label="Số điện thoại" required error={errors.phone_number?.message ?? serverErrors.phone_number}>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="0901234567"
            {...register("phone_number", {
              required: "Vui lòng nhập số điện thoại",
              pattern: { value: PHONE_RULE, message: "Số điện thoại di động Việt Nam không hợp lệ" },
            })}
          />
        </Field>

        <Field
          label="Mật khẩu"
          required
          hint="8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          error={errors.password?.message ?? serverErrors.password}
        >
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password", {
              required: "Vui lòng nhập mật khẩu",
              pattern: { value: PASSWORD_RULE, message: "Mật khẩu không đủ mạnh theo yêu cầu" },
            })}
          />
        </Field>

        <Field label="Xác nhận mật khẩu" required error={errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: "Vui lòng xác nhận mật khẩu",
              validate: (value) => value === getValues("password") || "Mật khẩu xác nhận không khớp",
            })}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
