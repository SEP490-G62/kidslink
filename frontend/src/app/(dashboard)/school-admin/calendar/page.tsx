"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import {
  bulkUpsertCalendar,
  createActivity,
  createSlot,
  deleteActivity,
  deleteSlot,
  getClassCalendar,
  listActivities,
  listSlots,
} from "@/lib/services/calendar";
import { listClasses } from "@/lib/services/school";
import { listTeachersForCalendar as listTeachers } from "@/lib/services/calendar";
import { ApiError } from "@/lib/api";
import { WEEKDAY_LABEL } from "@/lib/constants";
import type { Activity, CalendarEntry, Slot } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function CalendarPage() {
  const qc = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const slots = useQuery({ queryKey: ["slots"], queryFn: listSlots });
  const activities = useQuery({ queryKey: ["activities"], queryFn: listActivities });
  const teachers = useQuery({ queryKey: ["teachers-options"], queryFn: listTeachers });

  const [classId, setClassId] = useState("");
  const [weekStart, setWeekStart] = useState("2025-11-03");
  const [slotModal, setSlotModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ slotName: "", startTime: "07:30", endTime: "08:30" });
  const [activityForm, setActivityForm] = useState({ activityName: "", description: "", requireOutdoor: 0 });
  const [error, setError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const activeClassId = classId || classes.data?.[0]?.id || "";

  const calendar = useQuery({
    queryKey: ["calendar", activeClassId],
    queryFn: () => getClassCalendar(activeClassId),
    enabled: Boolean(activeClassId),
  });

  const teacherList = useMemo(() => {
    const raw = teachers.data as unknown;
    if (Array.isArray(raw)) return raw as { id: string; full_name?: string; user?: { full_name?: string } }[];
    return [];
  }, [teachers.data]);

  const teacherOptions = useMemo(() => {
    // Fall back to the class's assigned teacher when the endpoint returns nothing usable.
    const fromEndpoint = teacherList.map((t) => ({
      id: t.id,
      label: t.full_name ?? t.user?.full_name ?? t.id.slice(0, 8),
    }));
    if (fromEndpoint.length) return fromEndpoint;
    const cls = classes.data?.find((c) => c.id === activeClassId);
    return cls?.teacher_id ? [{ id: cls.teacher_id, label: "Giáo viên chủ nhiệm" }] : [];
  }, [teacherList, classes.data, activeClassId]);

  const entriesByKey = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const entry of calendar.data ?? []) {
      map.set(`${entry.date}|${entry.slot_id}`, entry);
    }
    return map;
  }, [calendar.data]);

  const weekDates = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    return WEEKDAYS.map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  const applySlot = (slot: Slot, weekdayIndex: number, activityId: string, teacherId: string) => {
    if (!activeClassId) return;
    const date = weekDates[weekdayIndex];
    setBulkBusy(true);
    setError(null);
    bulkUpsertCalendar({
      class_id: activeClassId,
      entries: [
        {
          weekday_id: "",
          slot_id: slot.id,
          activity_id: activityId,
          teacher_id: teacherId,
          date,
        },
      ],
    })
      .then(() => qc.invalidateQueries({ queryKey: ["calendar", activeClassId] }))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không lưu được lịch"))
      .finally(() => setBulkBusy(false));
  };

  const saveSlot = useMutation({
    mutationFn: () => createSlot(slotForm as unknown as Partial<Slot>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slots"] });
      setSlotModal(false);
      setSlotForm({ slotName: "", startTime: "07:30", endTime: "08:30" });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được khung giờ"),
  });

  const saveActivity = useMutation({
    mutationFn: () => createActivity(activityForm as unknown as Partial<Activity>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      setActivityModal(false);
      setActivityForm({ activityName: "", description: "", requireOutdoor: 0 });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được hoạt động"),
  });

  const removeSlot = useMutation({
    mutationFn: (id: string) => deleteSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được khung giờ"),
  });

  const removeActivity = useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được hoạt động"),
  });

  return (
    <div>
      <PageHeader
        title="Lịch học"
        description="Sắp xếp khung giờ và hoạt động cho từng lớp"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSlotModal(true)}>
              + Khung giờ
            </Button>
            <Button variant="outline" onClick={() => setActivityModal(true)}>
              + Hoạt động
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Lớp học">
          <Select value={activeClassId} onChange={(e) => setClassId(e.target.value)}>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tuần bắt đầu (thứ 2)">
          <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </Field>
      </div>

      {calendar.isLoading ? (
        <Loading />
      ) : (slots.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có khung giờ" description="Tạo khung giờ trước khi xếp lịch" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Khung giờ</th>
                {WEEKDAYS.map((day, i) => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {WEEKDAY_LABEL[day]}
                    <span className="ml-1 font-normal text-slate-400">{weekDates[i].slice(5)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(slots.data ?? []).map((slot) => (
                <tr key={slot.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-slate-800">{slot.slot_name}</p>
                    <p className="text-xs text-slate-500">
                      {slot.start_time} – {slot.end_time}
                    </p>
                  </td>
                  {WEEKDAYS.map((_, dayIndex) => {
                    const entry = entriesByKey.get(`${weekDates[dayIndex]}|${slot.id}`);
                    return (
                      <td key={dayIndex} className="px-2 py-2 align-top">
                        <select
                          value={entry?.activity_id ?? ""}
                          disabled={bulkBusy}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            applySlot(slot, dayIndex, e.target.value, entry?.teacher_id ?? teacherOptions[0]?.id ?? "");
                          }}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                        >
                          <option value="">— trống —</option>
                          {(activities.data ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.activity_name}
                            </option>
                          ))}
                        </select>
                        {entry && <p className="mt-1 truncate text-[10px] text-slate-400">Đã xếp</p>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Khung giờ" description="Dùng chung cho mọi lớp trong trường" />
          <CardBody>
            <ul className="space-y-2">
              {(slots.data ?? []).map((slot) => (
                <li key={slot.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-medium">{slot.slot_name}</span>{" "}
                    <span className="text-slate-400">
                      {slot.start_time}–{slot.end_time}
                    </span>
                  </span>
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={() => removeSlot.mutate(slot.id)}
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Hoạt động" description="Danh mục hoạt động học tập" />
          <CardBody>
            <ul className="space-y-2">
              {(activities.data ?? []).map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{activity.activity_name}</span>
                    {activity.require_outdoor === 1 && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
                        ngoài trời
                      </span>
                    )}
                    <span className="block text-xs text-slate-400">{activity.description}</span>
                  </span>
                  <button
                    className="shrink-0 text-xs text-rose-600 hover:underline"
                    onClick={() => removeActivity.mutate(activity.id)}
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Modal
        open={slotModal}
        title="Thêm khung giờ"
        onClose={() => setSlotModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSlotModal(false)}>
              Huỷ
            </Button>
            <Button loading={saveSlot.isPending} onClick={() => saveSlot.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên khung giờ" required>
            <Input value={slotForm.slotName} onChange={(e) => setSlotForm({ ...slotForm, slotName: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bắt đầu">
              <Input value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} />
            </Field>
            <Field label="Kết thúc">
              <Input value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={activityModal}
        title="Thêm hoạt động"
        onClose={() => setActivityModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActivityModal(false)}>
              Huỷ
            </Button>
            <Button loading={saveActivity.isPending} onClick={() => saveActivity.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên hoạt động" required>
            <Input
              value={activityForm.activityName}
              onChange={(e) => setActivityForm({ ...activityForm, activityName: e.target.value })}
            />
          </Field>
          <Field label="Mô tả" required>
            <Input
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            />
          </Field>
          <Field label="Địa điểm">
            <Select
              value={activityForm.requireOutdoor}
              onChange={(e) => setActivityForm({ ...activityForm, requireOutdoor: Number(e.target.value) })}
            >
              <option value={0}>Trong lớp</option>
              <option value={1}>Ngoài trời</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
