"use client";

import { DashboardShell } from "@/components/dashboard/sidebar";
import { RoleGuard } from "@/components/dashboard/role-guard";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="parent">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
