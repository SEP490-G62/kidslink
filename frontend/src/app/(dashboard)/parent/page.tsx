"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getChildren, getParentFees, getUnpaidCount, listPosts } from "@/lib/services/content";
import { parentDailyReports } from "@/lib/services/health";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatRelative, truncate } from "@/lib/format";

const RECENT_POST_COUNT = 5;

export default function ParentDashboard() {
  const { user } = useAuth();
  const children = useQuery({ queryKey: ["parent-children"], queryFn: getChildren });
  const unpaid = useQuery({ queryKey: ["parent-unpaid-count"], queryFn: getUnpaidCount });
  const fees = useQuery({ queryKey: ["parent-fees"], queryFn: () => getParentFees() });
  const posts = useQuery({ queryKey: ["parent-posts"], queryFn: () => listPosts("parent") });

  const firstChildId = children.data?.[0]?.id;
  const reports = useQuery({
    queryKey: ["parent-daily-reports", "dashboard", firstChildId],
    queryFn: () => parentDailyReports(firstChildId),
    enabled: Boolean(firstChildId),
  });

  const invoices = fees.data?.invoices ?? [];
  const outstanding = invoices
    .filter((invoice) => invoice.status !== 1)
    .reduce((sum, invoice) => sum + invoice.amount_due + (invoice.late_fee_amount ?? 0), 0);
  const latestReports = (reports.data ?? []).slice(0, 5);
  const latestPosts = (posts.data ?? []).slice(0, RECENT_POST_COUNT);

  return (
    <div>
      <PageHeader
        title="Tổng quan phụ huynh"
        description={user?.full_name ? `Xin chào ${user.full_name}` : "Theo dõi hoạt động học tập của con"}
      />

      {children.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {children.error instanceof ApiError ? children.error.message : "Không tải được danh sách con"}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Số con" value={children.data?.length ?? 0} icon="🧒" />
        <StatCard
          label="Hoá đơn chưa thanh toán"
          value={unpaid.data?.count ?? 0}
          hint={outstanding > 0 ? `Tổng ${formatCurrency(outstanding)}` : undefined}
          icon="💳"
        />
        <StatCard label="Báo cáo ngày gần nhất" value={reports.data?.length ?? 0} icon="📝" />
        <StatCard label="Bài đăng" value={posts.data?.length ?? 0} icon="📰" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Con của tôi"
            action={
              <Link href="/parent/children" className="text-xs font-medium text-indigo-600 hover:underline">
                Xem tất cả
              </Link>
            }
          />
          <CardBody>
            {children.isLoading ? (
              <Loading label="Đang tải danh sách con…" />
            ) : (children.data ?? []).length === 0 ? (
              <EmptyState title="Chưa có thông tin con" />
            ) : (
              (children.data ?? []).map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                      {child.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{child.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {child.class_name ?? child.school_class?.class_name ?? "Chưa xếp lớp"} · {formatDate(child.dob)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Báo cáo ngày gần đây"
            description={children.data?.[0] ? `Của ${children.data[0].full_name}` : undefined}
            action={
              <Link href="/parent/daily-reports" className="text-xs font-medium text-indigo-600 hover:underline">
                Chi tiết
              </Link>
            }
          />
          <CardBody>
            {reports.isLoading ? (
              <Loading label="Đang tải báo cáo…" />
            ) : latestReports.length === 0 ? (
              <EmptyState title="Chưa có báo cáo ngày" />
            ) : (
              latestReports.map((report) => (
                <div key={report.id} className="border-b border-slate-50 py-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{formatDate(report.report_date)}</span>
                    <span className="text-xs text-slate-500">
                      {report.checkin_time ?? "—"} → {report.checkout_time ?? "—"}
                    </span>
                  </div>
                  {report.comments && (
                    <p className="mt-1 text-xs text-slate-500">{truncate(report.comments, 100)}</p>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Bảng tin mới nhất"
            action={
              <Link href="/parent/posts" className="text-xs font-medium text-indigo-600 hover:underline">
                Xem bảng tin
              </Link>
            }
          />
          <CardBody>
            {posts.isLoading ? (
              <Loading label="Đang tải bảng tin…" />
            ) : latestPosts.length === 0 ? (
              <EmptyState title="Chưa có bài đăng nào" />
            ) : (
              latestPosts.map((post) => (
                <div key={post.id} className="border-b border-slate-50 py-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {post.user?.full_name ?? "Nhà trường"}
                    </span>
                    <span className="text-xs text-slate-400">{formatRelative(post.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{truncate(post.content, 160)}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
