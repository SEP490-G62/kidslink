"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/ui/card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Loading } from "@/components/ui/feedback";
import { listClasses, listStudents, listParents } from "@/lib/services/school";
import { listAllComplaints } from "@/lib/services/health";
import { useAuth } from "@/lib/auth-store";

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const students = useQuery({ queryKey: ["students"], queryFn: listStudents });
  const parents = useQuery({ queryKey: ["parents"], queryFn: listParents });
  const complaints = useQuery({ queryKey: ["complaints"], queryFn: () => listAllComplaints() });

  const pendingComplaints = (complaints.data ?? []).filter(c => c.status === "pending").length;

  if (classes.isLoading || students.isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Tổng quan nhà trường"
        description={`Xin chào ${user?.full_name}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lớp học" value={classes.data?.length ?? 0} icon="🏫" />
        <StatCard label="Học sinh" value={students.data?.length ?? 0} icon="🧒" />
        <StatCard label="Phụ huynh" value={parents.data?.length ?? 0} icon="👪" />
        <StatCard label="Khiếu nại chờ xử lý" value={pendingComplaints} icon="📮" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lớp học gần đây" />
          <CardBody>
            {(classes.data ?? []).slice(0, 5).map(cls => (
              <div key={cls.id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                <span className="text-sm font-medium text-slate-700">{cls.class_name}</span>
                <span className="text-xs text-slate-500">{cls.academic_year}</span>
              </div>
            ))}
            {(classes.data ?? []).length === 0 && <p className="text-sm text-slate-400">Chưa có lớp học</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Học sinh mới" />
          <CardBody>
            {(students.data ?? []).slice(0, 5).map(student => (
              <div key={student.id} className="flex items-center gap-3 border-b border-slate-50 py-2 last:border-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                  {student.full_name.charAt(0)}
                </div>
                <span className="text-sm text-slate-700">{student.full_name}</span>
              </div>
            ))}
            {(students.data ?? []).length === 0 && <p className="text-sm text-slate-400">Chưa có học sinh</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
