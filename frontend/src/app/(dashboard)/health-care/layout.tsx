"use client";

import { DashboardShell } from "@/components/dashboard/sidebar";
import { RoleGuard } from "@/components/dashboard/role-guard";

export default function HealthCareLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="health_care_staff">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
