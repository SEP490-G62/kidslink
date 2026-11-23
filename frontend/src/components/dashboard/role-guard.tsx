"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { Loading } from "@/components/ui/feedback";

/**
 * Chặn truy cập trái role ở phía client.
 * Backend vẫn là lớp bảo mật chính (JWT + @PreAuthorize).
 */
export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(ROLE_HOME[user.role] ?? "/");
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Đang xác thực phiên đăng nhập…" />
      </div>
    );
  }

  return <>{children}</>;
}
