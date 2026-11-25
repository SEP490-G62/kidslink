"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import { StudentPicker } from "@/components/health/student-picker";
import {
  createHealthNotice,
  createHealthRecord,
  healthClassStudents,
  healthClasses,
  type HealthStudent,
} from "@/lib/services/health";
import { ApiError } from "@/lib/api";
import { formatDate, formatGender, todayISO } from "@/lib/format";

const emptyRecord = { studentId: "", studentName: "", checkupDate: todayISO(), heightCm: "", weightKg: "", note: "" };
const emptyNotice = {
  studentId: "",
  studentName: "",
  symptoms: "",
  actionsTaken: "",
  medications: "",
  noticeTime: todayISO(),
  note: "",
};

export default function HealthCareClassesPage() {
  const qc = useQueryClient();
  const classes = useQuery({ queryKey: ["health-classes"], queryFn: healthClasses });
  const [classId, setClassId] = useState("");

  const activeClassId = classId || classes.data?.[0]?.id || "";

  const students = useQuery({
    queryKey: ["health-class-students", activeClassId],
    queryFn: () => healthClassStudents(activeClassId),
    enabled: Boolean(activeClassId),
  });

  const [recordModal, setRecordModal] = useState(false);
  const [noticeModal, setNoticeModal] = useState(false);
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [activeClassId]);

  const closeRecord = () => {
    setRecordModal(false);
    setRecordForm(emptyRecord);
  };
  const closeNotice = () => {
    setNoticeModal(false);
    setNoticeForm(emptyNotice);
  };

  const saveRecord = useMutation({
    mutationFn: () =>
      createHealthRecord({
        student_id: recordForm.studentId,
        checkup_date: recordForm.checkupDate,
        height_cm: Number(recordForm.heightCm),
        weight_kg: Number(recordForm.weightKg),
        note: recordForm.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-records"] });
      setError(null);
      setMessage("Đã thêm hồ sơ sức khoẻ");
      closeRecord();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không thêm được hồ sơ sức khoẻ"),
  });

  const saveNotice = useMutation({
    mutationFn: () =>
      createHealthNotice({
        student_id: noticeForm.studentId,
        symptoms: noticeForm.symptoms,
        actions_taken: noticeForm.actionsTaken,
        medications: noticeForm.medications,
        notice_time: noticeForm.noticeTime,
        note: noticeForm.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-notices"] });
      setError(null);
      setMessage("Đã gửi thông báo sức khoẻ");
      closeNotice();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được thông báo"),
  });

  const submitRecord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!recordForm.studentId) return setError("Vui lòng chọn học sinh");
    if (!recordForm.checkupDate) return setError("Vui lòng chọn ngày khám");
    if (!(Number(recordForm.heightCm) > 0) || !(Number(recordForm.weightKg) > 0)) {
      return setError("Chiều cao và cân nặng phải lớn hơn 0");
    }
    if (!recordForm.note.trim()) return setError("Vui lòng nhập ghi chú");
    saveRecord.mutate();
  };

  const submitNotice = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noticeForm.studentId) return setError("Vui lòng chọn học sinh");
    if (!noticeForm.symptoms.trim() || !noticeForm.actionsTaken.trim()) {
      return setError("Vui lòng nhập triệu chứng và biện pháp xử lý");
    }
    if (!noticeForm.medications.trim()) return setError("Vui lòng nhập thông tin thuốc (hoặc \"Không\")");
    if (!noticeForm.noticeTime) return setError("Vui lòng chọn ngày ghi nhận");
    if (!noticeForm.note.trim()) return setError("Vui lòng nhập ghi chú");
    saveNotice.mutate();
  };

  const columns: Column<HealthStudent>[] = [
    { key: "name", header: "Học sinh", render: (row) => <span className="font-medium text-slate-800">{row.fullName}</span> },
    { key: "dob", header: "Ngày sinh", render: (row) => formatDate(row.dob) },
    { key: "gender", header: "Giới tính", render: (row) => formatGender(row.gender ?? null) },
    {
      key: "allergy",
      header: "Dị ứng",
      render: (row) => row.allergy?.trim() || <span className="text-slate-400">—</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="px-3 py-1 text-xs"
            onClick={() => {
              setRecordModal(true);
              setRecordForm({ ...emptyRecord, studentId: row.id, studentName: row.fullName });
            }}
          >
            Thêm hồ sơ
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() => {
              setNoticeModal(true);
              setNoticeForm({ ...emptyNotice, studentId: row.id, studentName: row.fullName });
            }}
          >
            Thông báo
          </Button>
        </div>
      ),
    },
  ];

  if (classes.isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Lớp & học sinh"
        description="Chọn lớp để xem danh sách học sinh và ghi nhận hồ sơ sức khoẻ"
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {message && (
        <div className="mb-4">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      <div className="mb-6 max-w-sm">
        <Field label="Lớp học">
          <Select value={activeClassId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">— Chọn lớp —</option>
            {(classes.data ?? []).map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
                {cls.academicYear ? ` (${cls.academicYear})` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {!activeClassId ? (
        <EmptyState title="Chưa có lớp học" description="Nhà trường chưa gán lớp nào cho bạn phụ trách." />
      ) : students.isLoading ? (
        <Loading />
      ) : (
        <DataTable columns={columns} rows={students.data ?? []} emptyTitle="Lớp chưa có học sinh" />
      )}

      <Modal
        open={recordModal}
        title={`Thêm hồ sơ sức khoẻ${recordForm.studentName ? ` — ${recordForm.studentName}` : ""}`}
        onClose={closeRecord}
        footer={
          <>
            <Button variant="ghost" onClick={closeRecord}>
              Huỷ
            </Button>
            <Button type="submit" form="health-record-form" loading={saveRecord.isPending}>
              Lưu hồ sơ
            </Button>
          </>
        }
      >
        <form id="health-record-form" className="space-y-4" onSubmit={submitRecord}>
          <StudentPicker
            value={recordForm.studentId}
            onChange={(s) => setRecordForm({ ...recordForm, studentId: s.id, studentName: s.name })}
            required
          />
          <Field label="Ngày khám" required>
            <Input
              type="date"
              value={recordForm.checkupDate}
              onChange={(e) => setRecordForm({ ...recordForm, checkupDate: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Chiều cao (cm)" required>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={recordForm.heightCm}
                onChange={(e) => setRecordForm({ ...recordForm, heightCm: e.target.value })}
              />
            </Field>
            <Field label="Cân nặng (kg)" required>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={recordForm.weightKg}
                onChange={(e) => setRecordForm({ ...recordForm, weightKg: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Ghi chú" required>
            <Textarea value={recordForm.note} onChange={(e) => setRecordForm({ ...recordForm, note: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={noticeModal}
        title={`Thông báo sức khoẻ${noticeForm.studentName ? ` — ${noticeForm.studentName}` : ""}`}
        onClose={closeNotice}
        footer={
          <>
            <Button variant="ghost" onClick={closeNotice}>
              Huỷ
            </Button>
            <Button type="submit" form="health-notice-form" loading={saveNotice.isPending}>
              Gửi thông báo
            </Button>
          </>
        }
      >
        <form id="health-notice-form" className="space-y-4" onSubmit={submitNotice}>
          <StudentPicker
            value={noticeForm.studentId}
            onChange={(s) => setNoticeForm({ ...noticeForm, studentId: s.id, studentName: s.name })}
            required
          />
          <Field label="Ngày ghi nhận" required>
            <Input
              type="date"
              value={noticeForm.noticeTime}
              onChange={(e) => setNoticeForm({ ...noticeForm, noticeTime: e.target.value })}
            />
          </Field>
          <Field label="Triệu chứng" required>
            <Textarea
              value={noticeForm.symptoms}
              onChange={(e) => setNoticeForm({ ...noticeForm, symptoms: e.target.value })}
            />
          </Field>
          <Field label="Biện pháp xử lý" required>
            <Textarea
              value={noticeForm.actionsTaken}
              onChange={(e) => setNoticeForm({ ...noticeForm, actionsTaken: e.target.value })}
            />
          </Field>
          <Field label="Thuốc đã dùng" required hint='Nhập "Không" nếu không dùng thuốc'>
            <Input
              value={noticeForm.medications}
              onChange={(e) => setNoticeForm({ ...noticeForm, medications: e.target.value })}
            />
          </Field>
          <Field label="Ghi chú" required>
            <Textarea value={noticeForm.note} onChange={(e) => setNoticeForm({ ...noticeForm, note: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
