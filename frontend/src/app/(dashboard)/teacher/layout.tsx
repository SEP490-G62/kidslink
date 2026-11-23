"use client";

import { DashboardShell } from "@/components/dashboard/sidebar";
import { RoleGuard } from "@/components/dashboard/role-guard";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="teacher">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
