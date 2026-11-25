"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { createDish, deleteDish, listDishes, updateDish } from "@/lib/services/calendar";
import { ApiError } from "@/lib/api";
import type { Dish } from "@/lib/types";

export default function NutritionDishesPage() {
  const qc = useQueryClient();
  const dishes = useQuery({ queryKey: ["dishes"], queryFn: listDishes });

  const [modal, setModal] = useState<{ open: boolean; editing?: Dish }>({ open: false });
  const [form, setForm] = useState({ dishName: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["dishes"] });

  const save = useMutation({
    mutationFn: () =>
      modal.editing
        ? updateDish(modal.editing.id, { dishName: form.dishName, description: form.description })
        : createDish({ dishName: form.dishName, description: form.description, category: [] }),
    onSuccess: () => {
      invalidate();
      setModal({ open: false });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được món ăn"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDish(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được món ăn"),
  });

  const columns: Column<Dish>[] = [
    { key: "name", header: "Tên món", render: (r) => <span className="font-medium">{r.dish_name}</span> },
    { key: "desc", header: "Mô tả", render: (r) => <span className="text-slate-600">{r.description}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-3">
          <button
            className="text-xs font-medium text-indigo-600 hover:underline"
            onClick={() => {
              setForm({ dishName: r.dish_name, description: r.description });
              setError(null);
              setModal({ open: true, editing: r });
            }}
          >
            Sửa
          </button>
          <button
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => {
              if (confirm(`Xoá món ${r.dish_name}?`)) remove.mutate(r.id);
            }}
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Món ăn"
        description="Danh mục món ăn dùng cho thực đơn tuần"
        action={
          <Button
            onClick={() => {
              setForm({ dishName: "", description: "" });
              setError(null);
              setModal({ open: true });
            }}
          >
            + Thêm món
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {dishes.isLoading ? <Loading /> : <DataTable columns={columns} rows={dishes.data ?? []} emptyTitle="Chưa có món ăn" />}

      <Modal
        open={modal.open}
        title={modal.editing ? "Sửa món ăn" : "Thêm món ăn"}
        onClose={() => setModal({ open: false })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false })}>
              Huỷ
            </Button>
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên món" required>
            <Input value={form.dishName} onChange={(e) => setForm({ ...form, dishName: e.target.value })} />
          </Field>
          <Field label="Mô tả" required>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
