"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { getParentMenu } from "@/lib/services/calendar";
import { ApiError } from "@/lib/api";
import { WEEKDAY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";

/** Shape of a single dish after normalisation. */
interface DishView {
  id: string;
  name: string;
  description?: string;
}

/** One meal (bữa) on a given day. */
interface MealView {
  id: string;
  meal: string;
  dishes: DishView[];
}

/** All meals of one day. */
interface DayView {
  key: string;
  date: string | null;
  weekday?: string;
  meals: MealView[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function mondayOf(value: string): string {
  const date = parseISO(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return format(new Date(), "yyyy-MM-dd");
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return format(addDays(date, diff), "yyyy-MM-dd");
}


const MenuDishSchema = z.object({
  id: z.string().optional(),
  dish_name: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const MenuEntrySchema = z
  .object({
    id: z.string().optional(),
    date: z.string().optional(),
    menu_date: z.string().optional(),
    day_of_week: z.string().optional(),
    weekday_id: z.string().optional(),
    meal: z.union([z.string(), z.object({ meal: z.string().optional() })]).optional(),
    meal_name: z.string().optional(),
    weekday: z.object({ day_of_week: z.string().optional() }).optional(),
    dishes: z.array(MenuDishSchema).optional(),
  })
  .loose()
  .transform((entry): MenuEntryView => {
    const mealRelation = typeof entry.meal === "object" ? entry.meal.meal : undefined;
    const meal =
      mealRelation ??
      (typeof entry.meal === "string" ? entry.meal : undefined) ??
      entry.meal_name ??
      "Bữa ăn";

    return {
      id: entry.id,
      date: entry.date ?? entry.menu_date ?? null,
      weekday: entry.weekday?.day_of_week ?? entry.day_of_week ?? entry.weekday_id,
      meal,
      dishes: (entry.dishes ?? []).flatMap((dish) => {
        const name = dish.dish_name ?? dish.name;
        return name ? [{ id: dish.id, name, description: dish.description }] : [];
      }),
    };
  });

interface MenuEntryView {
  id?: string;
  date: string | null;
  weekday?: string;
  meal: string;
  dishes: { id?: string; name: string; description?: string }[];
}

const MenuEnvelopeSchema = z
  .object({
    menus: z.array(z.unknown()).optional(),
    menu: z.array(z.unknown()).optional(),
    data: z.array(z.unknown()).optional(),
    items: z.array(z.unknown()).optional(),
    weekly_menu: z.array(z.unknown()).optional(),
  })
  .loose();

/**
 * The parent-menu endpoint may answer with either an array of menu entries or an
 * object that carries the entries under one of a few plausible keys
 * (`menus`, `menu`, `data`, `items`). This surfaces every shape as a flat entry list.
 */
function extractMenuEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const envelope = MenuEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return [];

  const known = envelope.data.menus ?? envelope.data.menu ?? envelope.data.data ?? envelope.data.items ?? envelope.data.weekly_menu;
  if (known) return known;

  // Fallback: the object itself is a `{ weekday|date: entries[] }` map.
  return Object.values(envelope.data)
    .filter(Array.isArray)
    .flat();
}

function sortDays(days: DayView[]): DayView[] {
  const weekdayOrder = (day: DayView) => {
    const index = day.weekday ? WEEKDAYS.indexOf(day.weekday) : -1;
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return days.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return weekdayOrder(a) - weekdayOrder(b);
  });
}

/** Groups flat entries into `day → meals`. */
function groupByDay(raw: unknown): DayView[] {
  const days = new Map<string, DayView>();

  extractMenuEntries(raw).forEach((rawEntry, index) => {
    const parsed = MenuEntrySchema.safeParse(rawEntry);
    if (!parsed.success) return;
    const entry = parsed.data;
    const key = entry.date ?? entry.weekday ?? `day-${index}`;

    let day = days.get(key);
    if (!day) {
      day = { key, date: entry.date, weekday: entry.weekday, meals: [] };
      days.set(key, day);
    }
    day.meals.push({
      id: entry.id ?? `meal-${index}`,
      meal: entry.meal,
      dishes: entry.dishes.map((dish, dishIndex) => ({
        id: dish.id ?? `${key}-${index}-${dishIndex}`,
        name: dish.name,
        description: dish.description,
      })),
    });
  });

  return sortDays([...days.values()]);
}

function dayLabel(day: DayView): string {
  const weekday = day.weekday ? WEEKDAY_LABEL[day.weekday] ?? day.weekday : undefined;
  const date = day.date ? formatDate(day.date) : undefined;
  if (weekday && date) return `${weekday} · ${date}`;
  return weekday ?? date ?? "Ngày";
}

export default function ParentMenuPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(format(new Date(), "yyyy-MM-dd")));

  const normalizedWeek = useMemo(() => mondayOf(weekStart), [weekStart]);

  const menu = useQuery({
    queryKey: ["parent-menu", normalizedWeek],
    queryFn: () => getParentMenu(normalizedWeek),
    enabled: Boolean(normalizedWeek),
  });

  const days = useMemo(() => groupByDay(menu.data), [menu.data]);

  const shiftWeek = (amount: number) => {
    const next = addDays(parseISO(`${normalizedWeek}T00:00:00`), amount);
    setWeekStart(format(next, "yyyy-MM-dd"));
  };

  return (
    <div>
      <PageHeader title="Thực đơn tuần" description="Thực đơn của lớp con theo từng ngày và bữa ăn" />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Field label="Tuần bắt đầu (thứ 2)">
                <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
              </Field>
            </div>
            <Button variant="outline" onClick={() => shiftWeek(-7)}>
              ← Tuần trước
            </Button>
            <Button variant="outline" onClick={() => setWeekStart(mondayOf(format(new Date(), "yyyy-MM-dd")))}>
              Tuần này
            </Button>
            <Button variant="outline" onClick={() => shiftWeek(7)}>
              Tuần sau →
            </Button>
          </div>
        </CardBody>
      </Card>

      {menu.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {menu.error instanceof ApiError ? menu.error.message : "Không tải được thực đơn"}
          </Alert>
        </div>
      )}

      {menu.isLoading ? (
        <Loading label="Đang tải thực đơn…" />
      ) : days.length === 0 ? (
        <EmptyState title="Chưa có thực đơn" description="Nhà trường chưa công bố thực đơn cho tuần này." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {days.map((day) => (
            <Card key={day.key}>
              <CardHeader title={dayLabel(day)} />
              <CardBody>
                {day.meals.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có món ăn</p>
                ) : (
                  <div className="space-y-4">
                    {day.meals.map((meal) => (
                      <div key={meal.id}>
                        <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">{meal.meal}</p>
                        {meal.dishes.length === 0 ? (
                          <p className="mt-1 text-sm text-slate-400">Chưa có món</p>
                        ) : (
                          <ul className="mt-1.5 space-y-1">
                            {meal.dishes.map((dish) => (
                              <li key={dish.id} className="text-sm text-slate-700">
                                <span className="font-medium">{dish.name}</span>
                                {dish.description && (
                                  <span className="text-slate-500"> — {dish.description}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
