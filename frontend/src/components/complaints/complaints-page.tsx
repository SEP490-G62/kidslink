"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { createComplaint, listComplaintTypes, listMyComplaints } from "@/lib/services/health";
import { ApiError, uploadFiles } from "@/lib/api";
import { COMPLAINT_STATUS_LABEL } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-rose-100 text-rose-800",
};

interface ComplaintsProps {
  role: "teachers" | "parent";
  title: string;
  description?: string;
}

/** Màn khiếu nại dùng chung cho giáo viên và phụ huynh. */
export function ComplaintsPage({ role, title, description }: ComplaintsProps) {
  const qc = useQueryClient();
  const types = useQuery({ queryKey: ["complaint-types", role], queryFn: () => listComplaintTypes(role) });
  const mine = useQuery({ queryKey: ["my-complaints", role], queryFn: () => listMyComplaints(role) });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ complaintTypeId: "", reason: "", image: "" });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-complaints", role] });

  const submit = useMutation({
    mutationFn: async () => {
      const image = file ? (await uploadFiles([file]))[0] : form.image.trim() || undefined;
      return createComplaint(role, {
        complaint_type_id: form.complaintTypeId || types.data?.[0]?.id || "",
        reason: form.reason.trim(),
        image,
      });
    },
    onSuccess: () => {
      setModal(false);
      setForm({ complaintTypeId: "", reason: "", image: "" });
      setFile(null);
      setError(null);
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được khiếu nại"),
  });

  const rows = mine.data ?? [];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={<Button onClick={() => setModal(true)}>+ Gửi khiếu nại</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {mine.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có khiếu nại" description="Mọi phản ánh của bạn sẽ được nhà trường phản hồi tại đây." />
      ) : (
        <div className="space-y-4">
          {rows.map((complaint) => (
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
              <p className="mt-2 text-sm text-slate-700">{complaint.reason}</p>
              {complaint.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={complaint.image} alt="" className="mt-2 h-40 rounded-lg object-cover" />
              )}
              {complaint.response && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium">Phản hồi nhà trường: </span>
                  {complaint.response}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        title="Gửi khiếu nại"
        onClose={() => setModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Huỷ
            </Button>
            <Button
              loading={submit.isPending}
              disabled={!form.reason.trim()}
              onClick={() => submit.mutate()}
            >
              Gửi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Loại khiếu nại" required>
            <Select
              value={form.complaintTypeId}
              onChange={(e) => setForm({ ...form, complaintTypeId: e.target.value })}
            >
              {(types.data ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nội dung" required>
            <Textarea
              value={form.reason}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải…"
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
          <Field label="Ảnh minh hoạ" hint="Chọn tệp hoặc dán URL ảnh">
            <input
              type="file"
              accept="image/*"
              className="text-xs text-slate-500"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="URL ảnh (tuỳ chọn)">
            <Input
              placeholder="https://…"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
