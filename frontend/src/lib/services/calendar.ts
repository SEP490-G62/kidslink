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

export function getWeeklyDishes(classAgeId?: string, week?: string): Promise<ClassAgeMeal[]> {
  return api.get<ClassAgeMeal[]>(`/nutrition/class-age-meals/weekly-dishes${queryString({ class_age_id: classAgeId, week })}`);
}

// ---------- Parent ----------
export function getParentClassCalendar(): Promise<CalendarEntry[]> {
  return api.get<CalendarEntry[]>("/parent/class-calendar");
}

export function getParentMenu(week?: string): Promise<ClassAgeMeal[]> {
  return api.get<ClassAgeMeal[]>(`/parent/menu${queryString({ week })}`);
}
