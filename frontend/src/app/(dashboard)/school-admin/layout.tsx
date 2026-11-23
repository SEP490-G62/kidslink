"use client";

import { DashboardShell } from "@/components/dashboard/sidebar";
import { RoleGuard } from "@/components/dashboard/role-guard";

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="school_admin">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
