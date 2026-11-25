"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { createComplaint, listComplaintTypes, listMyComplaints } from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { COMPLAINT_STATUS_LABEL } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-rose-100 text-rose-800",
};

const MY_COMPLAINTS_KEY = ["parent-complaints"] as const;

export default function ParentComplaintsPage() {
  const qc = useQueryClient();
  const complaints = useQuery({ queryKey: MY_COMPLAINTS_KEY, queryFn: () => listMyComplaints("parent") });
  const types = useQuery({ queryKey: ["parent-complaint-types"], queryFn: () => listComplaintTypes("parent") });

  const [typeId, setTypeId] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeTypeId = typeId || types.data?.[0]?.id || "";

  const submit = useMutation({
    mutationFn: () =>
      createComplaint("parent", {
        complaint_type_id: activeTypeId,
        reason: reason.trim(),
        image: image.trim() || undefined,
      }),
    onSuccess: () => {
      setReason("");
      setImage("");
      setError(null);
      setSuccess("Khiếu nại đã được gửi tới nhà trường.");
      qc.invalidateQueries({ queryKey: MY_COMPLAINTS_KEY });
    },
    onError: (e) => {
      setSuccess(null);
      setError(e instanceof ApiError ? e.message : "Không gửi được khiếu nại");
    },
  });

  const rows = complaints.data ?? [];
  const canSubmit = Boolean(activeTypeId && reason.trim());

  return (
    <div>
      <PageHeader title="Khiếu nại" description="Gửi phản ánh tới nhà trường và theo dõi kết quả xử lý" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Tạo khiếu nại mới" />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) submit.mutate();
              }}
            >
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Field label="Loại khiếu nại" required>
                {types.isLoading ? (
                  <Loading label="Đang tải loại khiếu nại…" />
                ) : (
                  <Select value={activeTypeId} onChange={(e) => setTypeId(e.target.value)}>
                    {(types.data ?? []).length === 0 && <option value="">Chưa có loại khiếu nại</option>}
                    {(types.data ?? []).map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Nội dung" required hint="Mô tả chi tiết vấn đề bạn gặp phải">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Thực đơn tuần này không đúng như công bố…"
                />
              </Field>

              <Field label="Hình ảnh minh hoạ (URL)">
                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
              </Field>

              <Button type="submit" loading={submit.isPending} disabled={!canSubmit} className="w-full">
                Gửi khiếu nại
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Khiếu nại của tôi ({rows.length})</h2>

          {complaints.isLoading ? (
            <Loading label="Đang tải khiếu nại…" />
          ) : complaints.isError ? (
            <Alert variant="error">
              {complaints.error instanceof ApiError ? complaints.error.message : "Không tải được khiếu nại"}
            </Alert>
          ) : rows.length === 0 ? (
            <EmptyState title="Chưa có khiếu nại nào" description="Các khiếu nại bạn gửi sẽ hiển thị ở đây." />
          ) : (
            rows.map((complaint) => (
              <article key={complaint.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{complaint.complaint_type_name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      STATUS_STYLE[complaint.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {COMPLAINT_STATUS_LABEL[complaint.status] ?? complaint.status}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{formatRelative(complaint.createdAt)}</span>
                </div>

                <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{complaint.reason}</p>

                {complaint.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={complaint.image}
                    alt=""
                    className="mt-3 max-h-56 rounded-lg border border-slate-200 object-contain"
                  />
                )}

                {complaint.response && (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-800">Phản hồi từ nhà trường</p>
                    <p className="mt-1 text-sm whitespace-pre-line text-emerald-900">{complaint.response}</p>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
