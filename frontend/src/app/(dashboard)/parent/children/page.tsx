"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { getChildren } from "@/lib/services/content";
import {
  createPickup,
  deletePickup,
  getChildInfo,
  updatePickup,
} from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { RELATIONSHIP_OPTIONS } from "@/lib/constants";
import { formatDate, formatGender } from "@/lib/format";
import type { HealthNotice, HealthRecord, Pickup } from "@/lib/types";

interface StudentDetail {
  id?: string;
  full_name?: string;
  dob?: string;
  gender?: number;
  allergy?: string;
  avatar_url?: string;
  class_name?: string;
  school_class?: { class_name?: string; teacher?: { user?: { full_name?: string } } | null; co_teacher?: { user?: { full_name?: string } } | null };
  teacher?: { user?: { full_name?: string } } | null;
  co_teacher?: { user?: { full_name?: string } } | null;
}

/** `ChildInfo.student` is typed as `unknown`; narrow it safely before rendering. */
function asStudent(raw: unknown): StudentDetail | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as StudentDetail;
}

function relationshipLabel(value: string | undefined): string {
  if (!value) return "—";
  return RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const EMPTY_PICKUP: Omit<Pickup, "id"> = {
  full_name: "",
  relationship: "father",
  id_card_number: "",
  avatar_url: "",
  phone: "",
};

export default function ChildrenPage() {
  const qc = useQueryClient();
  const children = useQuery({ queryKey: ["parent-children"], queryFn: getChildren });
  const [selectedId, setSelectedId] = useState("");
  const activeId = selectedId || children.data?.[0]?.id || "";

  const info = useQuery({
    queryKey: ["parent-child-info", activeId],
    queryFn: () => getChildInfo(activeId),
    enabled: Boolean(activeId),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pickup | null>(null);
  const [form, setForm] = useState<Omit<Pickup, "id">>(EMPTY_PICKUP);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["parent-child-info", activeId] });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PICKUP);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (pickup: Pickup) => {
    setEditing(pickup);
    setForm({
      full_name: pickup.full_name ?? "",
      relationship: pickup.relationship ?? "father",
      id_card_number: pickup.id_card_number ?? "",
      avatar_url: pickup.avatar_url ?? "",
      phone: pickup.phone ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      if (!form.full_name.trim()) throw new Error("Vui lòng nhập họ tên người đón");
      if (!form.phone.trim()) throw new Error("Vui lòng nhập số điện thoại");
      return editing
        ? updatePickup(activeId, editing.id, form)
        : createPickup(activeId, form);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
      setFormError(null);
    },
    onError: (e) =>
      setFormError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Không lưu được người đón"),
  });

  const remove = useMutation({
    mutationFn: (pickupId: string) => deletePickup(activeId, pickupId),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được người đón"),
  });

  const student = asStudent(info.data?.student);
  const child = children.data?.find((c) => c.id === activeId);
  const className =
    student?.class_name ?? student?.school_class?.class_name ?? child?.class_name ?? child?.school_class?.class_name ?? "Chưa xếp lớp";
  const teacherName =
    student?.teacher?.user?.full_name ??
    student?.school_class?.teacher?.user?.full_name ??
    "Chưa phân công";
  const coTeacherName = student?.co_teacher?.user?.full_name ?? student?.school_class?.co_teacher?.user?.full_name;

  return (
    <div>
      <PageHeader title="Thông tin con" description="Thông tin cá nhân, lớp học, sức khoẻ và người đón trẻ" />

      {children.isError && (
        <div className="mb-4">
          <Alert variant="error">Không tải được danh sách con</Alert>
        </div>
      )}

      {children.isLoading ? (
        <Loading label="Đang tải danh sách con…" />
      ) : (children.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có thông tin con" description="Vui lòng liên hệ nhà trường để được liên kết hồ sơ." />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(children.data ?? []).map((c) => (
              <Button
                key={c.id}
                variant={c.id === activeId ? "primary" : "secondary"}
                onClick={() => setSelectedId(c.id)}
              >
                {c.full_name}
              </Button>
            ))}
          </div>

          {info.isLoading ? (
            <Loading />
          ) : info.isError ? (
            <Alert variant="error">
              {info.error instanceof ApiError ? info.error.message : "Không tải được thông tin con"}
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader title="Thông tin cá nhân" />
                <CardBody>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">Họ và tên</dt>
                      <dd className="text-sm font-medium text-slate-800">
                        {student?.full_name ?? child?.full_name ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Ngày sinh</dt>
                      <dd className="text-sm text-slate-800">{formatDate(student?.dob ?? child?.dob)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Giới tính</dt>
                      <dd className="text-sm text-slate-800">{formatGender(student?.gender ?? child?.gender)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Lớp</dt>
                      <dd className="text-sm text-slate-800">{className}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Giáo viên chủ nhiệm</dt>
                      <dd className="text-sm text-slate-800">{teacherName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Giáo viên phụ trách</dt>
                      <dd className="text-sm text-slate-800">{coTeacherName ?? "—"}</dd>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <dt className="text-xs text-slate-500">Dị ứng</dt>
                      <dd className="text-sm text-slate-800">{student?.allergy?.trim() || "Không có"}</dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Người được phép đón"
                  description="Danh sách người có thể đón trẻ tại trường"
                  action={
                    <Button variant="outline" onClick={openCreate}>
                      + Thêm người đón
                    </Button>
                  }
                />
                <CardBody>
                  {error && (
                    <div className="mb-3">
                      <Alert variant="error">{error}</Alert>
                    </div>
                  )}
                  {(info.data?.pickups ?? []).length === 0 ? (
                    <EmptyState title="Chưa có người đón nào" />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {(info.data?.pickups ?? []).map((pickup) => (
                        <li key={pickup.id} className="flex flex-wrap items-center gap-3 py-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {pickup.full_name?.charAt(0) ?? "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{pickup.full_name}</p>
                            <p className="text-xs text-slate-500">
                              {relationshipLabel(pickup.relationship)} · {pickup.phone || "—"} · CMND {pickup.id_card_number || "—"}
                            </p>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <button
                              type="button"
                              className="font-medium text-indigo-600 hover:underline"
                              onClick={() => openEdit(pickup)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="font-medium text-rose-600 hover:underline"
                              onClick={() => {
                                if (confirm(`Xoá người đón ${pickup.full_name}?`)) remove.mutate(pickup.id);
                              }}
                            >
                              Xoá
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Hồ sơ sức khoẻ" description="Các lần khám sức khoẻ định kỳ" />
                  <CardBody>
                    {(info.data?.health_records ?? []).length === 0 ? (
                      <EmptyState title="Chưa có hồ sơ sức khoẻ" />
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {(info.data?.health_records ?? []).map((record: HealthRecord) => (
                          <li key={record.id} className="py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">{formatDate(record.checkup_date)}</span>
                              <span className="text-xs text-slate-500">
                                {record.height_cm} cm · {record.weight_kg} kg
                              </span>
                            </div>
                            {record.note && <p className="mt-1 text-xs text-slate-500">{record.note}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Thông báo sức khoẻ" description="Các sự cố sức khoẻ được y tế ghi nhận" />
                  <CardBody>
                    {(info.data?.health_notices ?? []).length === 0 ? (
                      <EmptyState title="Không có thông báo nào" />
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {(info.data?.health_notices ?? []).map((notice: HealthNotice) => (
                          <li key={notice.id} className="py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">{notice.symptoms}</span>
                              <span className="text-xs text-slate-500">{formatDate(notice.notice_time)}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              <span className="font-medium">Xử lý:</span> {notice.actions_taken || "—"}
                            </p>
                            <p className="text-xs text-slate-600">
                              <span className="font-medium">Thuốc:</span> {notice.medications || "—"}
                            </p>
                            {notice.note && <p className="mt-1 text-xs text-slate-500">{notice.note}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Sửa người đón" : "Thêm người đón"}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Huỷ
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Field label="Họ và tên" required>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Quan hệ với trẻ" required>
            <Select
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Số điện thoại" required>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xxxxxxxx"
            />
          </Field>
          <Field label="Số CMND/CCCD">
            <Input
              value={form.id_card_number}
              onChange={(e) => setForm({ ...form, id_card_number: e.target.value })}
            />
          </Field>
          <Field label="Ảnh đại diện (URL)">
            <Input
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://…"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
