"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert, Loading } from "@/components/ui/feedback";
import { getMySchool, updateMySchool } from "@/lib/services/school";
import { ApiError } from "@/lib/api";
import type { School } from "@/lib/types";

interface FormState {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  payosClientId: string;
  payosApiKey: string;
  payosChecksumKey: string;
  payosAccountNumber: string;
  payosAccountName: string;
  payosBankCode: string;
  payosActive: boolean;
}

const EMPTY: FormState = {
  schoolName: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
  payosClientId: "",
  payosApiKey: "",
  payosChecksumKey: "",
  payosAccountNumber: "",
  payosAccountName: "",
  payosBankCode: "",
  payosActive: false,
};

function toForm(school: School): FormState {
  return {
    schoolName: school.school_name ?? "",
    address: school.address ?? "",
    phone: school.phone ?? "",
    email: school.email ?? "",
    logoUrl: school.logo_url ?? "",
    payosClientId: school.payos_config?.client_id ?? "",
    payosApiKey: school.payos_config?.api_key ?? "",
    payosChecksumKey: school.payos_config?.checksum_key ?? "",
    payosAccountNumber: school.payos_config?.account_number ?? "",
    payosAccountName: school.payos_config?.account_name ?? "",
    payosBankCode: school.payos_config?.bank_code ?? "",
    payosActive: school.payos_config?.active ?? false,
  };
}

export default function SchoolSettingsPage() {
  const qc = useQueryClient();
  const school = useQuery({ queryKey: ["my-school"], queryFn: getMySchool });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school.data) setForm(toForm(school.data));
  }, [school.data]);

  const save = useMutation({
    mutationFn: () =>
      updateMySchool({
        school_name: form.schoolName,
        address: form.address,
        phone: form.phone,
        email: form.email,
        logo_url: form.logoUrl,
        payos_config: {
          client_id: form.payosClientId,
          api_key: form.payosApiKey,
          checksum_key: form.payosChecksumKey,
          account_number: form.payosAccountNumber,
          account_name: form.payosAccountName,
          bank_code: form.payosBankCode,
          active: form.payosActive,
        },
      } as unknown as Partial<School>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-school"] });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không lưu được thông tin trường"),
  });

  if (school.isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Thông tin trường" description="Thông tin công khai và cấu hình thanh toán" />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert variant="success">Đã lưu thông tin trường</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Thông tin chung" />
          <CardBody>
            <div className="space-y-4">
              <Field label="Tên trường" required>
                <Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
              </Field>
              <Field label="Địa chỉ" required>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Điện thoại">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              </div>
              <Field label="Logo (URL)">
                <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cấu hình PayOS" description="Cho phép phụ huynh thanh toán online" />
          <CardBody>
            <div className="space-y-4">
              <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={form.payosActive}
                  onChange={(e) => setForm({ ...form, payosActive: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Bật thanh toán trực tuyến</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Client ID">
                  <Input
                    value={form.payosClientId}
                    onChange={(e) => setForm({ ...form, payosClientId: e.target.value })}
                  />
                </Field>
                <Field label="API Key">
                  <Input
                    type="password"
                    value={form.payosApiKey}
                    onChange={(e) => setForm({ ...form, payosApiKey: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Checksum Key">
                <Input
                  type="password"
                  value={form.payosChecksumKey}
                  onChange={(e) => setForm({ ...form, payosChecksumKey: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Số tài khoản">
                  <Input
                    value={form.payosAccountNumber}
                    onChange={(e) => setForm({ ...form, payosAccountNumber: e.target.value })}
                  />
                </Field>
                <Field label="Tên tài khoản">
                  <Input
                    value={form.payosAccountName}
                    onChange={(e) => setForm({ ...form, payosAccountName: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Mã ngân hàng">
                <Input
                  value={form.payosBankCode}
                  placeholder="Ví dụ: MB, VCB, TCB"
                  onChange={(e) => setForm({ ...form, payosBankCode: e.target.value })}
                />
              </Field>
              <p className="text-xs text-slate-500">
                Khi chưa bật, phụ huynh chỉ có thể thanh toán trực tiếp tại trường.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
