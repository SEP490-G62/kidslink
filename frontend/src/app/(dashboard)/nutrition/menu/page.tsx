"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { listClassAges } from "@/lib/services/school";
import {
  assignMenu,
  getWeeklyDishes,
  listDishes,
  listMeals,
  listWeekDays,
  normalizeWeeklySchedule,
} from "@/lib/services/calendar";
import { ApiError } from "@/lib/api";
import { WEEKDAY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

export default function NutritionMenuPage() {
  const qc = useQueryClient();
  const ages = useQuery({ queryKey: ["class-ages"], queryFn: listClassAges });
  const meals = useQuery({ queryKey: ["meals"], queryFn: listMeals });
  const weekdays = useQuery({ queryKey: ["weekdays"], queryFn: listWeekDays });
  const dishes = useQuery({ queryKey: ["dishes"], queryFn: listDishes });

  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const [classAgeId, setClassAgeId] = useState("");
  const [editing, setEditing] = useState<{ mealId: string; weekdayId: string; date: string } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeAgeId = classAgeId || ages.data?.[0]?.id || "";

  const weekly = useQuery({
    queryKey: ["weekly-dishes", activeAgeId, weekStart],
    queryFn: () => getWeeklyDishes(activeAgeId, weekStart),
    enabled: Boolean(activeAgeId),
  });

  const schedule = useMemo(() => normalizeWeeklySchedule(weekly.data), [weekly.data]);

  const weekDates = WEEKDAYS.map((_, index) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + index);
    return d.toISOString().slice(0, 10);
  });

  const save = useMutation({
    mutationFn: () =>
      assignMenu({
        class_age_id: activeAgeId,
        meal_id: editing?.mealId ?? "",
        weekday_id: editing?.weekdayId ?? "",
        date: editing?.date ?? weekStart,
        dish_ids: selected,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-dishes"] });
      setEditing(null);
      setSelected([]);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được thực đơn"),
  });

  return (
    <div>
      <PageHeader title="Thực đơn tuần" description="Xếp món cho từng bữa theo nhóm tuổi" />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nhóm tuổi">
          <Select value={activeAgeId} onChange={(e) => setClassAgeId(e.target.value)}>
            {(ages.data ?? []).map((age) => (
              <option key={age.id} value={age.id}>
                {age.age_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tuần bắt đầu (thứ 2)">
          <Input type="date" value={weekStart} onChange={(e) => setWeekStart(mondayOf(e.target.value))} />
        </Field>
      </div>

      {weekly.isLoading ? (
        <Loading />
      ) : (meals.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có bữa ăn" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Bữa</th>
                {WEEKDAYS.map((day, index) => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {WEEKDAY_LABEL[day]}
                    <span className="ml-1 font-normal text-slate-400">{formatDate(weekDates[index], "dd/MM")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(meals.data ?? []).map((meal) => (
                <tr key={meal.id}>
                  <td className="px-4 py-3 align-top font-medium text-slate-800">{meal.meal}</td>
                  {WEEKDAYS.map((day, dayIndex) => {
                    const weekday = (weekdays.data ?? []).find((w) => w.day_of_week === day);
                    const key = weekday ? `${activeAgeId}|${meal.id}|${weekday.id}` : "";
                    const slot = schedule.byMealWeekday[key];
                    const dishNames = (slot?.dishes ?? []).map((d) => d.dish_name);
                    return (
                      <td key={day} className="px-2 py-2 align-top">
                        <button
                          className="w-full rounded-md border border-dashed border-slate-200 px-2 py-2 text-left text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40"
                          onClick={() => {
                            if (!weekday) return;
                            setSelected((slot?.dishes ?? []).map((d) => d.id));
                            setError(null);
                            setEditing({ mealId: meal.id, weekdayId: weekday.id, date: weekDates[dayIndex] });
                          }}
                        >
                          {dishNames.length ? dishNames.join(", ") : <span className="text-slate-400">+ Chọn món</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title="Chọn món cho bữa ăn"
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Lưu thực đơn
            </Button>
          </>
        }
      >
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {(dishes.data ?? []).map((dish) => (
            <label
              key={dish.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(dish.id)}
                onChange={(e) =>
                  setSelected((prev) => (e.target.checked ? [...prev, dish.id] : prev.filter((id) => id !== dish.id)))
                }
              />
              <span>
                <span className="text-sm font-medium text-slate-800">{dish.dish_name}</span>
                <span className="block text-xs text-slate-500">{dish.description}</span>
              </span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
