"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Field, Select } from "@/components/ui/input";
import { healthClassStudents, healthClasses } from "@/lib/services/health";

export interface PickedStudent {
  id: string;
  name: string;
}

/**
 * Chọn học sinh theo lớp khi tạo hồ sơ/bảng tin sức khoẻ.
 * Nhận vào id đã chọn và trả về `{ id, name }` để form hiển thị tên học sinh.
 */
export function StudentPicker({
  value,
  onChange,
  label = "Học sinh",
  required,
  disabled,
}: {
  value: string;
  onChange: (student: PickedStudent) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const classes = useQuery({ queryKey: ["health-classes"], queryFn: healthClasses });
  const [classId, setClassId] = useState("");

  const activeClassId = classId || classes.data?.[0]?.id || "";

  const students = useQuery({
    queryKey: ["health-class-students", activeClassId],
    queryFn: () => healthClassStudents(activeClassId),
    enabled: Boolean(activeClassId),
  });

  const options = useMemo(() => students.data ?? [], [students.data]);

  return (
    <div className="space-y-3">
      <Field label="Lớp">
        <Select
          value={activeClassId}
          disabled={disabled}
          onChange={(e) => {
            setClassId(e.target.value);
            onChange({ id: "", name: "" });
          }}
        >
          <option value="">— Chọn lớp —</option>
          {(classes.data ?? []).map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.className}
              {cls.academicYear ? ` (${cls.academicYear})` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={label} required={required}>
        <Select
          value={value}
          disabled={disabled || !activeClassId}
          onChange={(e) => {
            const student = options.find((item) => item.id === e.target.value);
            onChange({ id: e.target.value, name: student?.fullName ?? "" });
          }}
        >
          <option value="">— Chọn học sinh —</option>
          {options.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** Map id học sinh → tên, dùng để hiển thị cột "Học sinh" trong bảng. */
export function useStudentNames(ids: string[]): Record<string, string> {
  const classes = useQuery({ queryKey: ["health-classes"], queryFn: healthClasses });
  const uniqueIds = useMemo(() => Array.from(new Set(ids.filter(Boolean))).sort(), [ids]);

  const roster = useQuery({
    queryKey: ["health-students-roster", classes.data?.map((c) => c.id).join(",") ?? ""],
    queryFn: async () => {
      const lists = await Promise.all((classes.data ?? []).map((cls) => healthClassStudents(cls.id)));
      return lists.flat();
    },
    enabled: Boolean(classes.data?.length),
  });

  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const student of roster.data ?? []) map[student.id] = student.fullName;
    for (const id of uniqueIds) if (!map[id]) map[id] = id;
    return map;
  }, [roster.data, uniqueIds]);
}
