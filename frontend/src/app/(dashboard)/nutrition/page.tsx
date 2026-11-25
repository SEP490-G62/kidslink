"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Loading } from "@/components/ui/feedback";
import { listDishes, listMeals, listClassAgeMeals } from "@/lib/services/calendar";
import { useAuth } from "@/lib/auth-store";

export default function NutritionDashboard() {
  const { user } = useAuth();
  const dishes = useQuery({ queryKey: ["dishes"], queryFn: listDishes });
  const meals = useQuery({ queryKey: ["meals"], queryFn: listMeals });
  const menus = useQuery({ queryKey: ["class-age-meals"], queryFn: listClassAgeMeals });

  if (dishes.isLoading) return <Loading />;

  const menuCount = Array.isArray(menus.data) ? menus.data.length : 0;

  return (
    <div>
      <PageHeader title="Tổng quan dinh dưỡng" description={`Xin chào ${user?.full_name ?? ""}`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Món ăn" value={dishes.data?.length ?? 0} icon="🍲" />
        <StatCard label="Bữa ăn" value={meals.data?.length ?? 0} icon="🍽" />
        <StatCard label="Thực đơn đã xếp" value={menuCount} icon="🍱" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Món ăn trong thực đơn" />
          <CardBody>
            {(dishes.data ?? []).slice(0, 6).map((dish) => (
              <div key={dish.id} className="border-b border-slate-50 py-2 last:border-0">
                <p className="text-sm font-medium text-slate-800">{dish.dish_name}</p>
                <p className="text-xs text-slate-500">{dish.description}</p>
              </div>
            ))}
            {(dishes.data ?? []).length === 0 && <p className="text-sm text-slate-400">Chưa có món ăn</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Các bữa trong ngày" />
          <CardBody>
            {(meals.data ?? []).map((meal) => (
              <div key={meal.id} className="border-b border-slate-50 py-2 text-sm text-slate-700 last:border-0">
                {meal.meal}
              </div>
            ))}
            {(meals.data ?? []).length === 0 && <p className="text-sm text-slate-400">Chưa có bữa ăn</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
