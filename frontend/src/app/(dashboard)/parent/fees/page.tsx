"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardBody, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, Loading, Modal } from "@/components/ui/feedback";
import { DataTable, type Column } from "@/components/ui/table";
import { checkPayosStatus, createPayosLink, getParentFees, getUnpaidCount } from "@/lib/services/content";
import { ApiError } from "@/lib/api";
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Invoice } from "@/lib/types";

interface PayosLink {
  checkout_url?: string;
  qr_code?: string;
  qr_url?: string;
  order_code?: number;
}

/** The backend reports an unconfigured PayOS account with this message. */
const PAYOS_UNCONFIGURED = "chưa cấu hình thanh toán";

function isPayosUnconfigured(error: unknown): boolean {
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "";
  return message.toLowerCase().includes(PAYOS_UNCONFIGURED);
}


export default function ParentFeesPage() {
  const qc = useQueryClient();
  const fees = useQuery({ queryKey: ["parent-fees"], queryFn: () => getParentFees() });
  const unpaid = useQuery({ queryKey: ["parent-unpaid-count"], queryFn: getUnpaidCount });

  const [error, setError] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const [payos, setPayos] = useState<{ invoice: Invoice; link: PayosLink } | null>(null);
  const [checkResult, setCheckResult] = useState<{ invoiceId: string; message: string; paid: boolean } | null>(null);

  const invoices = fees.data?.invoices ?? [];
  const outstanding = invoices
    .filter((invoice) => invoice.status !== 1)
    .reduce((sum, invoice) => sum + invoice.amount_due + (invoice.late_fee_amount ?? 0), 0);

  const payOnline = useMutation({
    mutationFn: (invoice: Invoice) => createPayosLink(invoice.id),
    onSuccess: (link, invoice) => {
      setError(null);
      setUnconfigured(false);
      setCheckResult(null);
      setPayos({ invoice, link });
    },
    onError: (e) => {
      if (isPayosUnconfigured(e)) {
        setUnconfigured(true);
        setError(null);
      } else {
        setError(e instanceof ApiError ? e.message : "Không tạo được liên kết thanh toán");
      }
    },
  });

  const check = useMutation({
    mutationFn: (invoice: Invoice) => checkPayosStatus(invoice.id),
    onSuccess: (result, invoice) => {
      setError(null);
      setCheckResult({
        invoiceId: invoice.id,
        paid: Boolean(result.paid) || result.status === 1,
        message: result.paid || result.status === 1 ? "Hoá đơn đã được thanh toán" : "Chưa nhận được thanh toán",
      });
      qc.invalidateQueries({ queryKey: ["parent-fees"] });
      qc.invalidateQueries({ queryKey: ["parent-unpaid-count"] });
    },
    onError: (e) => {
      if (isPayosUnconfigured(e)) {
        setUnconfigured(true);
        setError(null);
      } else {
        setError(e instanceof ApiError ? e.message : "Không kiểm tra được trạng thái thanh toán");
      }
    },
  });

  const columns: Column<Invoice>[] = [
    {
      key: "fee",
      header: "Khoản phí",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.fee?.fee_name ?? "Học phí"}</p>
          {row.student?.full_name && <p className="text-xs text-slate-500">Học sinh: {row.student.full_name}</p>}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Số tiền",
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-slate-900">{formatCurrency(row.amount_due)}</p>
          {Boolean(row.late_fee_amount) && (
            <p className="text-xs text-rose-600">Phí trễ: {formatCurrency(row.late_fee_amount)}</p>
          )}
          {Boolean(row.discount) && <p className="text-xs text-emerald-600">Giảm: {formatCurrency(row.discount)}</p>}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "due",
      header: "Hạn thanh toán",
      render: (row) => formatDate(row.due_date),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            INVOICE_STATUS_COLOR[row.status] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {INVOICE_STATUS_LABEL[row.status] ?? "Không xác định"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status !== 1 && (
            <Button
              variant="primary"
              className="px-3 py-1.5 text-xs"
              loading={payOnline.isPending && payOnline.variables?.id === row.id}
              onClick={() => payOnline.mutate(row)}
            >
              Thanh toán online
            </Button>
          )}
          {row.payos_order_code ? (
            <Button
              variant="outline"
              className="px-3 py-1.5 text-xs"
              loading={check.isPending && check.variables?.id === row.id}
              onClick={() => check.mutate(row)}
            >
              Kiểm tra
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Học phí" description="Theo dõi hoá đơn và thanh toán trực tuyến" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng hoá đơn" value={invoices.length} icon="🧾" />
        <StatCard label="Chưa thanh toán" value={unpaid.data?.count ?? 0} icon="⏳" />
        <StatCard label="Số tiền còn nợ" value={formatCurrency(outstanding)} icon="💰" />
      </div>

      {unconfigured && (
        <div className="mb-4">
          <Alert variant="info">
            Nhà trường chưa cấu hình thanh toán trực tuyến. Vui lòng liên hệ văn phòng nhà trường để thanh toán theo
            hình thức khác.
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {checkResult && (
        <div className="mb-4">
          <Alert variant={checkResult.paid ? "success" : "info"}>{checkResult.message}</Alert>
        </div>
      )}

      {fees.isError && (
        <div className="mb-4">
          <Alert variant="error">
            {fees.error instanceof ApiError ? fees.error.message : "Không tải được danh sách hoá đơn"}
          </Alert>
        </div>
      )}

      {fees.isLoading ? (
        <Loading label="Đang tải hoá đơn…" />
      ) : (
        <DataTable columns={columns} rows={invoices} emptyTitle="Chưa có hoá đơn nào" />
      )}

      {(fees.data?.fees ?? []).length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Biểu phí của trường" description="Các khoản phí đang áp dụng" />
          <CardBody>
            <ul className="divide-y divide-slate-100">
              {(fees.data?.fees ?? []).map((fee) => (
                <li key={fee.id} className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{fee.fee_name}</p>
                    {fee.description && <p className="text-xs text-slate-500">{fee.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(fee.amount)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Modal
        open={Boolean(payos)}
        title="Thanh toán trực tuyến"
        onClose={() => setPayos(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setPayos(null)}>
              Đóng
            </Button>
            <Button
              loading={check.isPending}
              onClick={() => {
                if (!payos) return;
                check.mutate(payos.invoice);
                setPayos(null);
              }}
            >
              Tôi đã thanh toán
            </Button>
          </>
        }
      >
        {payos && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">{payos.invoice.fee?.fee_name ?? "Học phí"}</p>
              <p className="text-slate-600">{formatCurrency(payos.invoice.amount_due)}</p>
              <p className="text-xs text-slate-500">Hạn: {formatDate(payos.invoice.due_date)}</p>
              {payos.link.order_code && (
                <p className="mt-1 text-xs text-slate-500">Mã đơn: {payos.link.order_code}</p>
              )}
              {payos.invoice.payos_expired_at && (
                <p className="text-xs text-slate-500">
                  Hết hạn: {formatDateTime(payos.invoice.payos_expired_at)}
                </p>
              )}
            </div>

            {payos.link.qr_url || payos.link.qr_code ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payos.link.qr_url ?? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payos.link.qr_code ?? "")}`}
                  alt="Mã QR thanh toán"
                  className="size-60 rounded-lg border border-slate-200 bg-white object-contain p-2"
                />
                <p className="text-center text-xs text-slate-500">
                  Mở ứng dụng ngân hàng và quét mã QR để thanh toán
                </p>
              </div>
            ) : (
              <Alert variant="info">Không có mã QR, vui lòng dùng liên kết thanh toán bên dưới.</Alert>
            )}

            {payos.link.checkout_url && (
              <div className="text-center">
                <a
                  href={payos.link.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Mở trang thanh toán
                </a>
                <p className="mt-2 break-all text-xs text-slate-400">{payos.link.checkout_url}</p>
              </div>
            )}

            {!payos.link.checkout_url && !payos.link.qr_url && !payos.link.qr_code && (
              <div className="flex items-center gap-2">
                <Badge color="amber">Chưa có liên kết</Badge>
                <span className="text-xs text-slate-500">Máy chủ không trả về liên kết thanh toán.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
