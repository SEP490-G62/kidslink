"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import {
  approveComplaint,
  createComplaintType,
  deleteComplaintType,
  listAllComplaints,
  listComplaintTypes,
  rejectComplaint,
} from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { COMPLAINT_STATUS_LABEL } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-rose-100 text-rose-800",
};

export default function ComplaintsPage() {
  const qc = useQueryClient();
  const complaints = useQuery({ queryKey: ["school-admin-complaints"], queryFn: () => listAllComplaints() });
  const types = useQuery({ queryKey: ["complaint-types"], queryFn: () => listComplaintTypes("school-admin") });

  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [selected, setSelected] = useState<{ id: string; decision: "approve" | "reject" } | null>(null);
  const [response, setResponse] = useState("");
  const [typeModal, setTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["school-admin-complaints"] });
    qc.invalidateQueries({ queryKey: ["complaint-types"] });
  };

  const decide = useMutation({
    mutationFn: () =>
      selected?.decision === "approve"
        ? approveComplaint(selected.id, response)
        : rejectComplaint(selected?.id ?? "", response),
    onSuccess: () => {
      invalidate();
      setSelected(null);
      setResponse("");
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xử lý được khiếu nại"),
  });

  const saveType = useMutation({
    mutationFn: () =>
      createComplaintType({ name: typeForm.name, description: typeForm.description, category: ["teacher", "parent"] }),
    onSuccess: () => {
      invalidate();
      setTypeModal(false);
      setTypeForm({ name: "", description: "" });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được loại khiếu nại"),
  });

  const removeType = useMutation({
    mutationFn: (id: string) => deleteComplaintType(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được loại khiếu nại"),
  });

  const rows = (complaints.data ?? []).filter((c) => (tab === "pending" ? c.status === "pending" : true));

  return (
    <div>
      <PageHeader
        title="Khiếu nại"
        description="Tiếp nhận và phản hồi khiếu nại từ phụ huynh và giáo viên"
        action={
          <Button variant="outline" onClick={() => setTypeModal(true)}>
            + Loại khiếu nại
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <Button variant={tab === "pending" ? "primary" : "secondary"} onClick={() => setTab("pending")}>
          Chờ xử lý ({(complaints.data ?? []).filter((c) => c.status === "pending").length})
        </Button>
        <Button variant={tab === "all" ? "primary" : "secondary"} onClick={() => setTab("all")}>
          Tất cả ({complaints.data?.length ?? 0})
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {complaints.isLoading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState title="Không có khiếu nại nào" />
          ) : (
            rows.map((complaint) => (
              <article key={complaint.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{complaint.complaint_type_name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[complaint.status]}`}>
                    {COMPLAINT_STATUS_LABEL[complaint.status]}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{formatRelative(complaint.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Từ {complaint.user?.full_name ?? "người dùng"}
                </p>
                <p className="mt-2 text-sm text-slate-700">{complaint.reason}</p>
                {complaint.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={complaint.image} alt="" className="mt-2 h-40 rounded-lg object-cover" />
                )}
                {complaint.response && (
                  <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-medium">Phản hồi: </span>
                    {complaint.response}
                  </p>
                )}
                {complaint.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => {
                        setResponse("");
                        setSelected({ id: complaint.id, decision: "approve" });
                      }}
                    >
                      Duyệt
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setResponse("");
                        setSelected({ id: complaint.id, decision: "reject" });
                      }}
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800">Loại khiếu nại</h3>
          <ul className="mt-3 space-y-2">
            {(types.data ?? []).map((type) => (
              <li key={type.id} className="flex items-start justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium text-slate-700">{type.name}</span>
                  <span className="block text-xs text-slate-400">{type.description}</span>
                </span>
                <button
                  className="shrink-0 text-xs text-rose-600 hover:underline"
                  onClick={() => removeType.mutate(type.id)}
                >
                  Xoá
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected?.decision === "approve" ? "Duyệt khiếu nại" : "Từ chối khiếu nại"}
        onClose={() => setSelected(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Huỷ
            </Button>
            <Button
              variant={selected?.decision === "reject" ? "danger" : "primary"}
              loading={decide.isPending}
              onClick={() => decide.mutate()}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <Field label="Phản hồi cho người gửi">
          <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Nội dung phản hồi…" />
        </Field>
      </Modal>

      <Modal
        open={typeModal}
        title="Thêm loại khiếu nại"
        onClose={() => setTypeModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTypeModal(false)}>
              Huỷ
            </Button>
            <Button loading={saveType.isPending} onClick={() => saveType.mutate()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên loại" required>
            <Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
          </Field>
          <Field label="Mô tả">
            <Textarea
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
