"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getParentClassCalendar } from "@/lib/services/calendar";
import { getChildren } from "@/lib/services/content";
import { ApiError } from "@/lib/api";
import { WEEKDAY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { CalendarEntry } from "@/lib/types";

interface SlotRow {
  id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * `getParentClassCalendar` returns a flat list of entries; derive the distinct
 * time slots (sorted by start time) and index entries by `slot_id|weekday`.
 */
function buildGrid(entries: CalendarEntry[]) {
  const slots = new Map<string, SlotRow>();
  const cells = new Map<string, CalendarEntry[]>();

  for (const entry of entries) {
    const slotKey = entry.slot_id ?? entry.slot?.id;
    if (!slotKey) continue;

    if (!slots.has(slotKey)) {
      slots.set(slotKey, {
        id: slotKey,
        slot_name: entry.slot?.slot_name ?? "Khung giờ",
        start_time: entry.slot?.start_time ?? "",
        end_time: entry.slot?.end_time ?? "",
      });
    }

    // `weekday` may be missing on the entry itself; fall back to its relation or the date.
    const weekdayKey = entry.weekday?.day_of_week ?? entry.weekday_id ?? "";
    if (!weekdayKey) continue;
    const key = `${slotKey}|${weekdayKey}`;
    const list = cells.get(key);
    if (list) list.push(entry);
    else cells.set(key, [entry]);
  }

  const sortedSlots = [...slots.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  return { slots: sortedSlots, cells };
}

export default function ParentCalendarPage() {
  const children = useQuery({ queryKey: ["parent-children"], queryFn: getChildren });
  const calendar = useQuery({ queryKey: ["parent-class-calendar"], queryFn: getParentClassCalendar });

  const { slots, cells } = useMemo(() => buildGrid(calendar.data ?? []), [calendar.data]);

  const childName = children.data?.[0]?.full_name;
  const className = children.data?.[0]?.class_name ?? children.data?.[0]?.school_class?.class_name;

  return (
    <div>
      <PageHeader
        title="Lịch học của con"
        description={
          childName
            ? `Thời khoá biểu ${className ? `lớp ${className} – ` : ""}của ${childName}`
            : "Thời khoá biểu lớp học của con"
        }
      />

      {calendar.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {calendar.error instanceof ApiError ? calendar.error.message : "Không tải được lịch học"}
          </Alert>
        </div>
      )}

      <Card>
        <CardHeader title="Thời khoá biểu" description="Khung giờ × thứ trong tuần" />
        <CardBody>
          {calendar.isLoading ? (
            <Loading label="Đang tải lịch học…" />
          ) : slots.length === 0 ? (
            <EmptyState title="Chưa có lịch học" description="Nhà trường chưa xếp thời khoá biểu cho lớp này." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                      Khung giờ
                    </th>
                    {WEEKDAYS.map((day) => (
                      <th
                        key={day}
                        className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase"
                      >
                        {WEEKDAY_LABEL[day] ?? day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <p className="font-medium text-slate-800">{slot.slot_name}</p>
                        <p className="text-xs text-slate-500">
                          {slot.start_time} – {slot.end_time}
                        </p>
                      </td>
                      {WEEKDAYS.map((day) => {
                        const entries = cells.get(`${slot.id}|${day}`) ?? [];
                        return (
                          <td key={day} className="px-4 py-3 align-top">
                            {entries.length === 0 ? (
                              <span className="text-xs text-slate-300">—</span>
                            ) : (
                              <ul className="space-y-2">
                                {entries.map((entry) => (
                                  <li
                                    key={entry.id}
                                    className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2"
                                  >
                                    <p className="text-sm font-medium text-indigo-900">
                                      {entry.activity?.activity_name ?? "Hoạt động"}
                                    </p>
                                    {entry.activity?.description && (
                                      <p className="mt-0.5 text-xs text-indigo-700">{entry.activity.description}</p>
                                    )}
                                    <p className="mt-1 text-[11px] text-slate-500">
                                      {formatDate(entry.date)}
                                      {entry.teacher?.user?.full_name
                                        ? ` · ${entry.teacher.user.full_name}`
                                        : ""}
                                    </p>
                                  </li>
                                ))}
                              </ul>
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
        </CardBody>
      </Card>
    </div>
  );
}
