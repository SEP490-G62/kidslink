"use client";

import { useAuth } from "@/lib/auth-store";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { PageHeader } from "@/components/ui/card";

export default function PostDetailPage() {
  const { user } = useAuth();

  return (
    <RoleGuard role="parent">
      <div>
        <PageHeader
          title="Chi tiết bài đăng"
          description="Xem toàn bộ bình luận và hoạt động của bài đăng này"
        />
        <p className="text-sm text-slate-500">
          {user?.full_name
            ? "Chọn một bài đăng trong bảng tin để xem chi tiết."
            : "Vui lòng đăng nhập để xem chi tiết bài đăng."}
        </p>
      </div>
    </RoleGuard>
  );
}
