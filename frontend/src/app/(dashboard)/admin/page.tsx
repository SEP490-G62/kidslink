"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, Loading } from "@/components/ui/feedback";
import { listSchools } from "@/lib/services/school";
import { listUsers, type UserPage } from "@/lib/services/user";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { User } from "@/lib/types";

function usersOf(raw: User[] | UserPage | undefined): User[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.items;
}

export default function AdminDashboard() {
  const schools = useQuery({ queryKey: ["admin-schools"], queryFn: listSchools });
  const users = useQuery({ queryKey: ["admin-users", "dashboard"], queryFn: () => listUsers({ size: 200 }) });

  if (schools.isLoading || users.isLoading) return <Loading />;

  const queryError = schools.isError
    ? "Không tải được danh sách trường học"
    : users.isError
      ? "Không tải được danh sách người dùng"
      : null;
  const allUsers = usersOf(users.data);
  const activeSchools = (schools.data ?? []).filter((school) => school.status === 1).length;

  return (
    <div>
      <PageHeader title="Quản trị hệ thống" description="Tổng quan toàn bộ nền tảng KidsLink" />
      {queryError && (
        <div className="mb-4">
          <Alert variant="error">{queryError}</Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trường học" value={schools.data?.length ?? 0} hint={`${activeSchools} đang hoạt động`} icon="🏫" />
        <StatCard label="Người dùng" value={allUsers.length} icon="👥" />
        <StatCard
          label="Giáo viên & phụ huynh"
          value={allUsers.filter((u) => u.role === "teacher" || u.role === "parent").length}
          icon="🧑‍🏫"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Trường học" />
          <CardBody>
            {(schools.data ?? []).slice(0, 6).map((school) => (
              <div key={school.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                <span className="text-sm text-slate-700">{school.school_name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    school.status === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {school.status === 1 ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>
            ))}
            {(schools.data ?? []).length === 0 && <p className="text-sm text-slate-400">Chưa có trường học</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Phân bố vai trò" />
          <CardBody>
            {Object.entries(ROLE_LABEL).map(([role, label]) => {
              const count = allUsers.filter((u) => u.role === role).length;
              return (
                <div key={role} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                  <span className="text-sm text-slate-700">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
