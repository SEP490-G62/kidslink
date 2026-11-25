"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getMyTeachingCalendar } from "@/lib/services/calendar";
import { listPosts } from "@/lib/services/content";
import {
  getClassStudents,
  getTeacherClasses,
  listMyComplaints,
} from "@/lib/services/health";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { formatRelative, todayISO, truncate } from "@/lib/format";
import {
  normalizeTeacherClasses,
  normalizeTeacherStudents,
  normalizeTeachingCalendar,
} from "@/lib/teacher";

const RECENT_POST_COUNT = 5;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const classes = useQuery({ queryKey: ["teacher-classes"], queryFn: getTeacherClasses });
  const students = useQuery({ queryKey: ["teacher-students"], queryFn: getClassStudents });
  const posts = useQuery({ queryKey: ["teacher-posts"], queryFn: () => listPosts("teachers") });
  const complaints = useQuery({ queryKey: ["teacher-complaints"], queryFn: () => listMyComplaints("teachers") });
  const calendar = useQuery({ queryKey: ["teacher-calendar"], queryFn: getMyTeachingCalendar });
  const classList = normalizeTeacherClasses(classes.data);
  const studentList = normalizeTeacherStudents(students.data);
  const today = todayISO();
  const todaySlots =
    normalizeTeachingCalendar(calendar.data).days.find((day) => day.date === today)?.slots ?? [];
  const latestPosts = (posts.data ?? []).slice(0, RECENT_POST_COUNT);
  const pendingComplaints = (complaints.data ?? []).filter((complaint) => complaint.status === "pending");
  const queryError = classes.isError
    ? errorMessage(classes.error, "Không tải được danh sách lớp")
    : students.isError
      ? errorMessage(students.error, "Không tải được danh sách học sinh")
      : posts.isError
        ? errorMessage(posts.error, "Không tải được bài đăng")
        : complaints.isError
          ? errorMessage(complaints.error, "Không tải được khiếu nại")
          : calendar.isError
            ? errorMessage(calendar.error, "Không tải được lịch dạy")
            : null;

  return (
    <div>
      <PageHeader
        title="Tổng quan giáo viên"
        description={user?.full_name ? `Xin chào ${user.full_name}` : "Theo dõi lớp học và hoạt động trong ngày"}
      />

      {queryError && (
        <div className="mb-4">
          <Alert variant="error">{queryError}</Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lớp đang dạy"
          value={classList.all.length}
          hint={classList.latest_academic_year ? `Năm học ${classList.latest_academic_year}` : undefined}
          icon="🏫"
        />
        <StatCard label="Học sinh" value={studentList.students.length} hint={studentList.class_name || undefined} icon="🧒" />
        <StatCard label="Bài đăng" value={posts.data?.length ?? 0} icon="📰" />
        <StatCard
          label="Khiếu nại chờ xử lý"
          value={pendingComplaints.length}
          hint={`Tổng ${complaints.data?.length ?? 0} đơn`}
          icon="📮"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Lịch dạy hôm nay"
            description={today}
            action={
              <Link href="/teacher/calendar" className="text-xs font-medium text-indigo-600 hover:underline">
                Xem cả tuần
              </Link>
            }
          />
          <CardBody>
            {calendar.isLoading ? (
              <Loading label="Đang tải lịch dạy…" />
            ) : todaySlots.length === 0 ? (
              <EmptyState title="Hôm nay không có tiết dạy" />
            ) : (
              <ul className="divide-y divide-slate-50">
                {todaySlots.map((slot) => (
                  <li key={slot.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {slot.class_name} · {slot.activity_name || "Hoạt động"}
                      </p>
                      {slot.activity_description && (
                        <p className="mt-0.5 text-xs text-slate-500">{slot.activity_description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Bài đăng mới nhất"
            action={
              <Link href="/teacher/posts" className="text-xs font-medium text-indigo-600 hover:underline">
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
              <div className="divide-y divide-slate-50">
                {latestPosts.map((post) => (
                  <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {post.user?.full_name ?? "Người dùng"}
                      </span>
                      <span className="text-xs text-slate-400">{formatRelative(post.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{truncate(post.content, 140)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Học sinh lớp tôi"
          description={studentList.class_name ? `Lớp ${studentList.class_name}` : undefined}
          action={
            <Link href="/teacher/class" className="text-xs font-medium text-indigo-600 hover:underline">
              Chi tiết lớp
            </Link>
          }
        />
        <CardBody>
          {students.isLoading ? (
            <Loading label="Đang tải học sinh…" />
          ) : studentList.students.length === 0 ? (
            <EmptyState title="Chưa có học sinh" description="Lớp chưa được xếp học sinh." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {studentList.students.map((student) => (
                <li key={student.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {student.full_name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{student.full_name}</p>
                    {student.allergy && <p className="truncate text-xs text-rose-600">Dị ứng: {student.allergy}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
