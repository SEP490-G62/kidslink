import { api, queryString } from "@/lib/api";
import type { Activity, CalendarEntry, ClassAgeMeal, Dish, Meal, Slot, WeekDay } from "@/lib/types";

// ---------- Slots ----------
export function listSlots(): Promise<Slot[]> {
  return api.get<Slot[]>("/school-admin/calendar/slots");
}

export function createSlot(payload: Partial<Slot>): Promise<Slot> {
  return api.post<Slot>("/school-admin/calendar/slots", payload);
}

export function updateSlot(id: string, payload: Partial<Slot>): Promise<Slot> {
  return api.put<Slot>(`/school-admin/calendar/slots/${id}`, payload);
}

export function deleteSlot(id: string): Promise<void> {
  return api.delete(`/school-admin/calendar/slots/${id}`);
}

// ---------- Activities ----------
export function listActivities(): Promise<Activity[]> {
  return api.get<Activity[]>("/school-admin/calendar/activities");
}

export function createActivity(payload: Partial<Activity>): Promise<Activity> {
  return api.post<Activity>("/school-admin/calendar/activities", payload);
}

export function updateActivity(id: string, payload: Partial<Activity>): Promise<Activity> {
  return api.put<Activity>(`/school-admin/calendar/activities/${id}`, payload);
}

export function deleteActivity(id: string): Promise<void> {
  return api.delete(`/school-admin/calendar/activities/${id}`);
}

// ---------- Calendar ----------
export function getClassCalendar(classId: string): Promise<CalendarEntry[]> {
  return api.get<CalendarEntry[]>(`/school-admin/calendar/class/${classId}`);
}

export function bulkUpsertCalendar(payload: {
  class_id: string;
  entries: { weekday_id: string; slot_id: string; activity_id: string; teacher_id: string; date: string }[];
}): Promise<CalendarEntry[]> {
  return api.post<CalendarEntry[]>("/school-admin/calendar/calendar/bulk", payload);
}

export function updateCalendarEntry(id: string, payload: Partial<CalendarEntry>): Promise<CalendarEntry> {
  return api.post<CalendarEntry>(`/school-admin/calendar/calendar/${id}`, payload);
}

export function deleteCalendarEntry(id: string): Promise<void> {
  return api.delete(`/school-admin/calendar/calendar/${id}`);
}

export function listTeachersForCalendar(): Promise<unknown[]> {
  return api.get("/school-admin/calendar/teachers");
}

// ---------- Teacher ----------
export function getMyTeachingCalendar(): Promise<CalendarEntry[]> {
  return api.get<CalendarEntry[]>("/teachers/teaching-calendar");
}

export function getClassCalendarForTeacher(): Promise<CalendarEntry[]> {
  return api.get<CalendarEntry[]>("/teachers/class-calendar");
}

// ---------- Nutrition ----------
export function listDishes(): Promise<Dish[]> {
  return api.get<Dish[]>("/nutrition/dishes");
}

export interface DishPayload {
  dishName: string;
  description: string;
  category?: string[];
}

export function createDish(payload: DishPayload): Promise<Dish> {
  return api.post<Dish>("/nutrition/dishes", payload);
}

export function updateDish(id: string, payload: Partial<DishPayload>): Promise<Dish> {
  return api.put<Dish>(`/nutrition/dishes/${id}`, payload);
}

export function deleteDish(id: string): Promise<void> {
  return api.delete(`/nutrition/dishes/${id}`);
}

export function listMeals(): Promise<Meal[]> {
  return api.get<Meal[]>("/nutrition/meals");
}

export function listWeekDays(): Promise<WeekDay[]> {
  return api.get<WeekDay[]>("/nutrition/weekdays");
}

export function listClassAgeMeals(): Promise<ClassAgeMeal[]> {
  return api.get<ClassAgeMeal[]>("/nutrition/class-age-meals");
}

export function assignMenu(payload: {
  class_age_id: string;
  weekday_id: string;
  meal_id: string;
  date: string;
  dish_ids: string[];
}): Promise<ClassAgeMeal> {
  return api.post<ClassAgeMeal>("/nutrition/class-age-meals/assign", payload);
}

export interface WeeklyMenuSlot {
  class_age_id?: string;
  meal_id?: string;
  weekday_id?: string;
  date?: string;
  dishes?: Dish[];
}

export interface WeeklySchedule {
  /** Key dạng `"<classAgeId>|<mealId>|<weekdayKey>"`. */
  byMealWeekday: Record<string, WeeklyMenuSlot>;
  /** Key dạng `"<classAgeId>|<mealId>"` — gộp tất cả các ngày đã xếp món. */
  byMeal: Record<string, WeeklyMenuSlot[]>;
}

const WEEKDAY_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toSlot(value: unknown): WeeklyMenuSlot | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    class_age_id: typeof record.class_age_id === "string" ? record.class_age_id : undefined,
    meal_id: typeof record.meal_id === "string" ? record.meal_id : undefined,
    weekday_id: typeof record.weekday_id === "string" ? record.weekday_id : undefined,
    date: typeof record.date === "string" ? record.date : undefined,
    dishes: Array.isArray(record.dishes) ? (record.dishes as Dish[]) : undefined,
  };
}

function pushSlot(target: WeeklySchedule, slot: WeeklyMenuSlot) {
  if (!slot.class_age_id || !slot.meal_id) return;
  if (slot.weekday_id) target.byMealWeekday[`${slot.class_age_id}|${slot.meal_id}|${slot.weekday_id}`] = slot;
  const key = `${slot.class_age_id}|${slot.meal_id}`;
  (target.byMeal[key] ??= []).push(slot);
}

/**
 * Thực đơn của một tuần (bắt đầu từ `weekStart`, thứ 2 của tuần).
 *
 * Backend có thể trả `{ schedule: { "<classAgeId>-<mealId>-<weekdayId>": {...} } }` hoặc
 * mảng `ClassAgeMeal` (legacy) — hãy đọc qua `normalizeWeeklySchedule`.
 */
export function getWeeklyDishes(classAgeId?: string, weekStart?: string): Promise<unknown> {
  return api.get(
    `/nutrition/class-age-meals/weekly-dishes${queryString({ week_start: weekStart, class_age_ids: classAgeId })}`,
  );
}

/** Narrowing cho hai dạng response của `getWeeklyDishes`. */
export function normalizeWeeklySchedule(raw: unknown): WeeklySchedule {
  const result: WeeklySchedule = { byMealWeekday: {}, byMeal: {} };

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const slot = toSlot(entry);
      if (slot) pushSlot(result, slot);
    }
    return result;
  }

  if (!raw || typeof raw !== "object") return result;
  const schedule = (raw as Record<string, unknown>).schedule;
  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) return result;

  for (const [key, value] of Object.entries(schedule as Record<string, unknown>)) {
    const slot = toSlot(value);
    if (!slot) continue;
    // Key legacy dạng "classAgeId-mealId-<weekdayId số 1..7>".
    if (!slot.weekday_id) {
      const index = Number(key.split("-").pop());
      if (Number.isInteger(index) && index >= 1 && index <= WEEKDAY_KEYS.length) {
        slot.weekday_id = WEEKDAY_KEYS[index - 1];
      }
    }
    pushSlot(result, slot);
  }

  return result;
}

export function updateNutritionProfile(payload: {
  full_name?: string;
  avatar_url?: string | null;
  email?: string;
  phone_number?: string;
}): Promise<{ message?: string; user?: unknown }> {
  return api.put("/nutrition/profile", payload);
}

// ---------- Parent ----------
export function getParentClassCalendar(): Promise<CalendarEntry[]> {
  return api.get<CalendarEntry[]>("/parent/class-calendar");
}

export function getParentMenu(week?: string): Promise<ClassAgeMeal[]> {
  return api.get<ClassAgeMeal[]>(`/parent/menu${queryString({ week })}`);
}
