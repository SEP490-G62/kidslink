"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getMyTeachingCalendar } from "@/lib/services/calendar";
import { WEEKDAY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { CalendarEntry } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

/** Reads the teaching-calendar payload: either a plain array or `{ schedules: [...] }`. */
function normalizeCalendar(raw: unknown): CalendarEntry[] {
  if (Array.isArray(raw)) return raw.filter((item): item is CalendarEntry => typeof item === "object" && item !== null);
  if (raw && typeof raw === "object") {
    const entries = raw as Record<string, unknown>;
    for (const key of ["schedules", "entries", "calendar"]) {
      const value = entries[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is CalendarEntry => typeof item === "object" && item !== null);
      }
    }
  }
  return [];
}

export default function TeacherCalendarPage() {
  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const calendar = useQuery({ queryKey: ["teacher-calendar"], queryFn: getMyTeachingCalendar });

  const entries = useMemo(() => normalizeCalendar(calendar.data), [calendar.data]);

  const weekDates = WEEKDAYS.map((_, index) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + index);
    return d.toISOString().slice(0, 10);
  });

  const slots = useMemo(() => {
    const seen = new Map<string, { id: string; label: string; time: string }>();
    for (const entry of entries) {
      if (!entry.slot) continue;
      seen.set(entry.slot_id, {
        id: entry.slot_id,
        label: entry.slot.slot_name,
        time: `${entry.slot.start_time}–${entry.slot.end_time}`,
      });
    }
    return [...seen.values()].sort((a, b) => a.time.localeCompare(b.time));
  }, [entries]);

  const grid = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const entry of entries) map.set(`${entry.date}|${entry.slot_id}`, entry);
    return map;
  }, [entries]);

  return (
    <div>
      <PageHeader title="Lịch dạy" description="Lịch giảng dạy theo tuần của bạn" />

      <div className="mb-6 max-w-xs">
        <Field label="Tuần bắt đầu (thứ 2)">
          <Input type="date" value={weekStart} onChange={(e) => setWeekStart(mondayOf(e.target.value))} />
        </Field>
      </div>

      {calendar.isLoading ? (
        <Loading />
      ) : slots.length === 0 ? (
        <EmptyState title="Chưa có lịch dạy" description="Nhà trường chưa xếp lịch cho lớp của bạn" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Khung giờ</th>
                {WEEKDAYS.map((day, index) => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {WEEKDAY_LABEL[day]}
                    <span className="ml-1 font-normal text-slate-400">{formatDate(weekDates[index], "dd/MM")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-slate-800">{slot.label}</p>
                    <p className="text-xs text-slate-500">{slot.time}</p>
                  </td>
                  {weekDates.map((date) => {
                    const entry = grid.get(`${date}|${slot.id}`);
                    return (
                      <td key={date} className="px-2 py-2 align-top">
                        {entry ? (
                          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1.5 text-xs">
                            <p className="font-medium text-indigo-800">{entry.activity?.activity_name ?? "Hoạt động"}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-4">
          <Alert variant="info">Tổng {entries.length} tiết trong lịch dạy của bạn.</Alert>
        </div>
      )}
    </div>
  );
}
