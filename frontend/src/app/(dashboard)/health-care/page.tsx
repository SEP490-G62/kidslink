"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { EmptyState, ErrorState, Loading } from "@/components/ui/feedback";
import { healthClasses, listHealthNotices, listHealthRecords } from "@/lib/services/health";
import { useAuth } from "@/lib/auth-store";
import { formatDate, formatRelative, truncate } from "@/lib/format";

export default function HealthCareDashboard() {
  const { user } = useAuth();
  const classes = useQuery({ queryKey: ["health-classes"], queryFn: healthClasses });
  const records = useQuery({ queryKey: ["health-records", undefined], queryFn: () => listHealthRecords() });
  const notices = useQuery({ queryKey: ["health-notices", undefined], queryFn: () => listHealthNotices() });

  const latestNotices = [...(notices.data ?? [])]
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, 5);

  if (classes.isLoading || records.isLoading || notices.isLoading) return <Loading />;

  if (classes.isError || records.isError || notices.isError) {
    return (
      <ErrorState
        onRetry={() => {
          classes.refetch();
          records.refetch();
          notices.refetch();
        }}
      />
    );
  }

  const studentsWithRecords = new Set((records.data ?? []).map((record) => record.student_id)).size;

  return (
    <div>
      <PageHeader title="Tổng quan y tế học đường" description={`Xin chào ${user?.full_name ?? ""}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lớp phụ trách" value={classes.data?.length ?? 0} icon="🏫" />
        <StatCard label="Hồ sơ sức khoẻ" value={records.data?.length ?? 0} icon="🩺" />
        <StatCard
          label="Học sinh đã khám"
          value={studentsWithRecords}
          hint="Số học sinh có ít nhất một hồ sơ"
          icon="🧒"
        />
        <StatCard label="Thông báo sức khoẻ" value={notices.data?.length ?? 0} icon="🚨" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Thông báo sức khoẻ mới nhất"
            description="5 thông báo gần đây"
            action={
              <Link href="/health-care/notices" className="text-xs font-medium text-indigo-600 hover:underline">
                Xem tất cả
              </Link>
            }
          />
          <CardBody>
            {latestNotices.length === 0 ? (
              <EmptyState title="Chưa có thông báo sức khoẻ" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {latestNotices.map((notice) => (
                  <li key={notice.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800">{truncate(notice.symptoms, 64)}</p>
                      <span className="shrink-0 text-xs text-slate-400">{formatRelative(notice.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{truncate(notice.actions_taken, 90)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Ngày ghi nhận: {formatDate(notice.notice_time)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Hồ sơ sức khoẻ gần đây"
            description="Lần khám gần nhất"
            action={
              <Link href="/health-care/records" className="text-xs font-medium text-indigo-600 hover:underline">
                Xem tất cả
              </Link>
            }
          />
          <CardBody>
            {(records.data ?? []).length === 0 ? (
              <EmptyState title="Chưa có hồ sơ sức khoẻ" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {(records.data ?? []).slice(0, 5).map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{formatDate(record.checkup_date)}</p>
                      <p className="text-xs text-slate-500">{truncate(record.note, 60)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {record.height_cm} cm · {record.weight_kg} kg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
