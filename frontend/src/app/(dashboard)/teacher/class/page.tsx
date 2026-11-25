"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/table";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { getClassStudents, getStudentDetail, getTeacherClasses } from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { RELATIONSHIP_OPTIONS } from "@/lib/constants";
import { formatDate, formatGender } from "@/lib/format";
import {
  normalizeStudentDetail,
  normalizeTeacherClasses,
  normalizeTeacherStudents,
  type TeacherStudent,
} from "@/lib/teacher";

function relationshipLabel(value: string): string {
  return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-2 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value || "—"}</span>
    </div>
  );
}

export default function TeacherClassPage() {
  const classes = useQuery({ queryKey: ["teacher-classes"], queryFn: getTeacherClasses });
  const students = useQuery({ queryKey: ["teacher-students"], queryFn: getClassStudents });
  const [selected, setSelected] = useState<TeacherStudent | null>(null);

  const detail = useQuery({
    queryKey: ["teacher-student-detail", selected?.id],
    queryFn: () => getStudentDetail(selected!.id),
    enabled: selected !== null,
  });

  const classInfo = normalizeTeacherClasses(classes.data);
  const studentInfo = normalizeTeacherStudents(students.data);
  const studentDetail = normalizeStudentDetail(detail.data);

  const columns: Column<TeacherStudent>[] = [
    {
      key: "name",
      header: "Học sinh",
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {row.full_name.charAt(0)}
          </span>
          <span className="font-medium text-slate-800">{row.full_name}</span>
        </div>
      ),
    },
    { key: "dob", header: "Ngày sinh", render: (row) => formatDate(row.dob) },
    { key: "gender", header: "Giới tính", render: (row) => formatGender(row.gender) },
    {
      key: "allergy",
      header: "Dị ứng",
      render: (row) => (row.allergy ? <span className="text-rose-600">{row.allergy}</span> : "—"),
    },
  ];

  return (
    <div>
      <PageHeader title="Lớp & học sinh" description="Các lớp bạn phụ trách và danh sách học sinh" />

      {classes.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {classes.error instanceof ApiError ? classes.error.message : "Không tải được danh sách lớp"}
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader
          title="Lớp của tôi"
          description={classInfo.latest_academic_year ? `Năm học hiện tại: ${classInfo.latest_academic_year}` : undefined}
        />
        <CardBody>
          {classes.isLoading ? (
            <Loading label="Đang tải lớp…" />
          ) : classInfo.groups.length === 0 ? (
            <EmptyState title="Bạn chưa được phân công lớp nào" />
          ) : (
            <div className="space-y-4">
              {classInfo.groups.map((group) => (
                <div key={group.academic_year}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Năm học {group.academic_year}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.classes.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Danh sách học sinh"
          description={studentInfo.class_name ? `Lớp ${studentInfo.class_name} · ${studentInfo.students.length} học sinh` : undefined}
        />
        <CardBody>
          {students.isLoading ? (
            <Loading label="Đang tải học sinh…" />
          ) : students.isError ? (
            <Alert variant="error">
              {students.error instanceof ApiError ? students.error.message : "Không tải được danh sách học sinh"}
            </Alert>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-500">Chọn một học sinh để xem chi tiết.</p>
              <DataTable columns={columns} rows={studentInfo.students} onRowClick={setSelected} />
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        open={selected !== null}
        title={selected ? `Hồ sơ ${selected.full_name}` : "Hồ sơ học sinh"}
        onClose={() => setSelected(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Đóng
            </Button>
            <Button onClick={() => setSelected(null)}>
              {detail.isFetching ? "Đang tải…" : "Xong"}
            </Button>
          </>
        }
      >
        {detail.isLoading ? (
          <Loading label="Đang tải hồ sơ…" />
        ) : detail.isError ? (
          <Alert variant="error">
            {detail.error instanceof ApiError ? detail.error.message : "Không tải được hồ sơ học sinh"}
          </Alert>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Thông tin</h3>
              <DetailRow label="Họ tên" value={studentDetail.student?.full_name ?? selected?.full_name ?? ""} />
              <DetailRow label="Ngày sinh" value={formatDate(studentDetail.student?.dob ?? selected?.dob)} />
              <DetailRow label="Giới tính" value={formatGender(studentDetail.student?.gender ?? selected?.gender)} />
              <DetailRow label="Dị ứng" value={studentDetail.student?.allergy ?? selected?.allergy ?? ""} />
              <DetailRow label="Lớp" value={studentDetail.classes.map((item) => item.name).join(", ")} />
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Phụ huynh</h3>
              {studentDetail.parents.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa liên kết phụ huynh.</p>
              ) : (
                <ul className="space-y-2">
                  {studentDetail.parents.map((parent) => (
                    <li key={parent.parent_id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="text-sm font-medium text-slate-800">
                        {parent.full_name}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({relationshipLabel(parent.relationship)})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {parent.phone_number || "—"} · {parent.email || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Người đón</h3>
              {studentDetail.pickups.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa đăng ký người đón.</p>
              ) : (
                <ul className="space-y-2">
                  {studentDetail.pickups.map((pickup) => (
                    <li key={pickup.id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="text-sm font-medium text-slate-800">
                        {pickup.full_name}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({relationshipLabel(pickup.relationship)})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {pickup.phone || "—"}
                        {pickup.id_card_number ? ` · CCCD ${pickup.id_card_number}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
