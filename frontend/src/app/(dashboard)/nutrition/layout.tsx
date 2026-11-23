"use client";

import { DashboardShell } from "@/components/dashboard/sidebar";
import { RoleGuard } from "@/components/dashboard/role-guard";

export default function NutritionLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="nutrition_staff">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
