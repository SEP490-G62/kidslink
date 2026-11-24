"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { listClassAges } from "@/lib/services/school";
import { assignMenu, createDish, deleteDish, listDishes, listMeals, listWeekDays, getWeeklyDishes } from "@/lib/services/calendar";
import { ApiError } from "@/lib/api";
import { WEEKDAY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ClassAgeMeal } from "@/lib/types";

interface MenuSlot {
  id?: string;
  dishes?: { name?: string; dish_name?: string }[];
}

/** Narrows the two response shapes the weekly-menu endpoint may return. */
function normalizeSchedule(raw: unknown): Record<string, MenuSlot> {
  if (Array.isArray(raw)) {
    const map: Record<string, MenuSlot> = {};
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue;
      const record = item as Record<string, unknown>;
      const classAgeId = record.class_age_id;
      const mealId = record.meal_id;
      const weekdayId = record.weekday_id;
      if (typeof classAgeId !== "string" || typeof mealId !== "string" || typeof weekdayId !== "string") {
        continue;
      }
      map[`${classAgeId}|${mealId}|${weekdayId}`] = item as MenuSlot;
    }
    return map;
  }
  if (raw && typeof raw === "object" && "schedule" in raw) {
    const { schedule } = raw;
    if (schedule && typeof schedule === "object") {
      return schedule as Record<string, MenuSlot>;
    }
  }
  return {};
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function MenuPage() {
  const qc = useQueryClient();
  const ages = useQuery({ queryKey: ["class-ages"], queryFn: listClassAges });
  const meals = useQuery({ queryKey: ["meals"], queryFn: listMeals });
  const weekdays = useQuery({ queryKey: ["weekdays"], queryFn: listWeekDays });
  const dishes = useQuery({ queryKey: ["dishes"], queryFn: listDishes });

  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const [classAgeId, setClassAgeId] = useState("");
  const [assignModal, setAssignModal] = useState<{ mealId: string; weekdayId: string; date: string } | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [dishModal, setDishModal] = useState(false);
  const [dishForm, setDishForm] = useState({ dishName: "", description: "", description2: "" });
  const [error, setError] = useState<string | null>(null);

  const activeAgeId = classAgeId || ages.data?.[0]?.id || "";

  const weekly = useQuery({
    queryKey: ["weekly-dishes", activeAgeId, weekStart],
    queryFn: () => getWeeklyDishes(activeAgeId, weekStart),
    enabled: Boolean(activeAgeId),
  });

  // The API returns either an array (legacy) or an object carrying a `schedule` map.
  const scheduleMap = normalizeSchedule(weekly.data);

  const weekDates = WEEKDAYS.map((_, index) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + index);
    return d.toISOString().slice(0, 10);
  });

  const saveAssign = useMutation({
    mutationFn: () => {
      if (!assignModal) throw new Error("missing");
      return assignMenu({
        class_age_id: activeAgeId,
        meal_id: assignModal.mealId,
        weekday_id: assignModal.weekdayId,
        date: assignModal.date,
        dish_ids: selectedDishes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-dishes"] });
      setAssignModal(null);
      setSelectedDishes([]);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được thực đơn"),
  });

  const saveDish = useMutation({
    mutationFn: () =>
      createDish({
        dishName: dishForm.dishName,
        description: dishForm.description,
        category: [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dishes"] });
      setDishModal(false);
      setDishForm({ dishName: "", description: "", description2: "" });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được món ăn"),
  });

  const removeDish = useMutation({
    mutationFn: (id: string) => deleteDish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dishes"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được món ăn"),
  });

  return (
    <div>
      <PageHeader
        title="Thực đơn"
        description="Xây dựng thực đơn tuần theo nhóm tuổi"
        action={<Button onClick={() => setDishModal(true)}>+ Thêm món ăn</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nhóm tuổi">
          <Select value={activeAgeId} onChange={(e) => setClassAgeId(e.target.value)}>
            {(ages.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.age_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tuần bắt đầu">
          <Input type="date" value={weekStart} onChange={(e) => setWeekStart(mondayOf(e.target.value))} />
        </Field>
      </div>

      {weekly.isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Bữa</th>
                {WEEKDAYS.map((day, i) => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {WEEKDAY_LABEL[day]}
                    <span className="ml-1 font-normal text-slate-400">{formatDate(weekDates[i], "dd/MM")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(meals.data ?? []).map((meal) => (
                <tr key={meal.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{meal.meal}</td>
                  {WEEKDAYS.map((day, dayIndex) => {
                    const weekday = (weekdays.data ?? []).find((w) => w.day_of_week === day);
                    const key = weekday ? `${activeAgeId}|${meal.id}|${weekday.id}` : "";
                    const entry: MenuSlot | undefined = scheduleMap[key];
                    return (
                      <td key={day} className="px-2 py-2 align-top">
                        <button
                          className="w-full rounded-md border border-dashed border-slate-200 px-2 py-2 text-left text-xs text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/40"
                          onClick={() => {
                            if (!weekday) return;
                            setSelectedDishes([]);
                            setError(null);
                            setAssignModal({ mealId: meal.id, weekdayId: weekday.id, date: weekDates[dayIndex] });
                          }}
                        >
                          {entry?.dishes?.length ? (
                            entry.dishes.map((d) => d.name ?? d.dish_name ?? "Món").join(", ")
                          ) : (
                            <span className="text-slate-400">+ Chọn món</span>
                          )}
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

      <Card className="mt-8">
        <CardHeader title="Danh mục món ăn" description="Dùng chung cho toàn trường" />
        <CardBody>
          {(dishes.data ?? []).length === 0 ? (
            <EmptyState title="Chưa có món ăn" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {(dishes.data ?? []).map((dish) => (
                <li key={dish.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3">
                  <span>
                    <span className="text-sm font-medium text-slate-800">{dish.dish_name}</span>
                    <span className="block text-xs text-slate-500">{dish.description}</span>
                  </span>
                  <button className="shrink-0 text-xs text-rose-600 hover:underline" onClick={() => removeDish.mutate(dish.id)}>
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(assignModal)}
        title="Chọn món cho bữa ăn"
        onClose={() => setAssignModal(null)}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignModal(null)}>
              Huỷ
            </Button>
            <Button loading={saveAssign.isPending} onClick={() => saveAssign.mutate()}>
              Lưu thực đơn
            </Button>
          </>
        }
      >
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {(dishes.data ?? []).map((dish) => (
            <label key={dish.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedDishes.includes(dish.id)}
                onChange={(e) =>
                  setSelectedDishes((prev) =>
                    e.target.checked ? [...prev, dish.id] : prev.filter((id) => id !== dish.id),
                  )
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

      <Modal
        open={dishModal}
        title="Thêm món ăn"
        onClose={() => setDishModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDishModal(false)}>
              Huỷ
            </Button>
            <Button loading={saveDish.isPending} onClick={() => saveDish.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên món" required>
            <Input value={dishForm.dishName} onChange={(e) => setDishForm({ ...dishForm, dishName: e.target.value })} />
          </Field>
          <Field label="Mô tả" required>
            <Textarea
              value={dishForm.description}
              onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
