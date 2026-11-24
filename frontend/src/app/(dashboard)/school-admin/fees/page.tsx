"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { listClasses } from "@/lib/services/school";
import {
  createSchoolFee,
  deleteSchoolFee,
  listSchoolFees,
  type SchoolFee,
  type SchoolFeePayload,
} from "@/lib/services/content";
import { formatCurrency, formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { LATE_FEE_TYPE_LABEL } from "@/lib/constants";

type FeeRow = SchoolFee;

async function fetchFees(): Promise<FeeRow[]> {
  const data = await listSchoolFees();
  return Array.isArray(data) ? data : data.fees ?? [];
}

function createFee(payload: SchoolFeePayload) {
  return createSchoolFee(payload);
}

function deleteFee(id: string) {
  return deleteSchoolFee(id);
}

export default function FeesPage() {
  const qc = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: listClasses });
  const fees = useQuery({ queryKey: ["fees"], queryFn: fetchFees });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    feeName: "",
    description: "",
    amount: 3500000,
    lateFeeType: "none",
    lateFeeValue: 0,
    classId: "",
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createFee({
        feeName: form.feeName,
        description: form.description,
        amount: Number(form.amount),
        lateFeeType: form.lateFeeType,
        lateFeeValue: Number(form.lateFeeValue),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      setModal(false);
      setForm({ feeName: "", description: "", amount: 3500000, lateFeeType: "none", lateFeeValue: 0, classId: "" });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được khoản phí"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được khoản phí"),
  });

  const columns: Column<FeeRow>[] = [
    { key: "name", header: "Tên khoản phí", render: (r) => <span className="font-medium">{r.fee_name}</span> },
    { key: "desc", header: "Mô tả", render: (r) => <span className="text-slate-500">{r.description}</span> },
    { key: "amount", header: "Số tiền", render: (r) => <span className="font-medium text-indigo-700">{formatCurrency(r.amount)}</span> },
    {
      key: "late",
      header: "Phí trễ hạn",
      render: (r) =>
        r.late_fee_type === "none"
          ? "—"
          : `${LATE_FEE_TYPE_LABEL[r.late_fee_type] ?? r.late_fee_type}: ${r.late_fee_type === "percentage" ? `${r.late_fee_value}%` : formatCurrency(r.late_fee_value)}`,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <button
          className="text-xs font-medium text-rose-600 hover:underline"
          onClick={() => {
            if (confirm(`Xoá khoản phí ${r.fee_name}?`)) remove.mutate(r.id);
          }}
        >
          Xoá
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Học phí"
        description="Thiết lập các khoản phí và áp dụng cho lớp học"
        action={<Button onClick={() => setModal(true)}>+ Thêm khoản phí</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {fees.isLoading ? <Loading /> : <DataTable columns={columns} rows={fees.data ?? []} emptyTitle="Chưa có khoản phí" />}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-800">Cách tính học phí</h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>• Số tiền phải nộp = Số tiền khoản phí × (1 − % giảm giá của học sinh)</li>
          <li>• Phí trễ hạn cố định: cộng thêm một khoản tiền khi quá hạn</li>
          <li>• Phí trễ hạn theo phần trăm: cộng thêm số tiền × % cấu hình</li>
          <li>• Học sinh chưa có hoá đơn sẽ hiển thị ở trạng thái chờ thanh toán</li>
        </ul>
      </div>

      <Modal
        open={modal}
        title="Thêm khoản phí"
        onClose={() => setModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Huỷ
            </Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên khoản phí" required>
            <Input
              placeholder="Học phí tháng 11"
              value={form.feeName}
              onChange={(e) => setForm({ ...form, feeName: e.target.value })}
            />
          </Field>
          <Field label="Mô tả" required>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Số tiền (VNĐ)" required>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loại phí trễ hạn">
              <Select
                value={form.lateFeeType}
                onChange={(e) => setForm({ ...form, lateFeeType: e.target.value })}
              >
                <option value="none">Không có</option>
                <option value="fixed">Cố định</option>
                <option value="percentage">Theo phần trăm</option>
              </Select>
            </Field>
            <Field label="Giá trị phí trễ hạn">
              <Input
                type="number"
                disabled={form.lateFeeType === "none"}
                value={form.lateFeeValue}
                onChange={(e) => setForm({ ...form, lateFeeValue: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Ghi chú" hint="Khoản phí được áp dụng cho lớp khi tạo hoá đơn">
            <Select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">— Không chọn —</option>
              {(classes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
