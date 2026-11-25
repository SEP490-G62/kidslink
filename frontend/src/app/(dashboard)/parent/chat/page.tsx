"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import {
  createDirectConversation,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
  teachersByStudent,
} from "@/lib/services/content";
import { getChildren } from "@/lib/services/content";
import { useAuth } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { z } from "zod";
import type { Conversation } from "@/lib/types";

/** `teachersByStudent` is untyped on the wire; parse it at the boundary. */
const TeacherOptionSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  full_name: z.string().optional(),
  user: z.object({ id: z.string().optional(), full_name: z.string().optional() }).optional(),
});

const TeacherListSchema = z.union([
  z.array(z.unknown()),
  z.object({ teachers: z.array(z.unknown()) }),
  z.object({ data: z.array(z.unknown()) }),
]);

interface TeacherOption {
  /** Messaging user id — this is what `createDirectConversation` expects. */
  userId: string;
  name: string;
}

export function parseTeacherOptions(raw: unknown): TeacherOption[] {
  const envelope = TeacherListSchema.safeParse(raw);
  if (!envelope.success) return [];
  const list = Array.isArray(envelope.data)
    ? envelope.data
    : "teachers" in envelope.data
      ? envelope.data.teachers
      : envelope.data.data;

  const options: TeacherOption[] = [];
  for (const item of list) {
    const parsed = TeacherOptionSchema.safeParse(item);
    if (!parsed.success) continue;
    const userId = parsed.data.user_id ?? parsed.data.user?.id ?? parsed.data.id;
    const name = parsed.data.full_name ?? parsed.data.user?.full_name ?? userId.slice(0, 8);
    options.push({ userId, name });
  }
  return options;
}

export const conversationTitle = (conversation: Conversation) =>
  conversation.title || (conversation.is_class_group ? "Nhóm lớp" : "Trò chuyện");

export default function ParentChatPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const children = useQuery({ queryKey: ["parent-children"], queryFn: getChildren });
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: listConversations });

  const activeChildId = studentId || children.data?.[0]?.id || "";

  const teachers = useQuery({
    queryKey: ["teachers-by-student", activeChildId],
    queryFn: () => teachersByStudent(activeChildId),
    enabled: Boolean(activeChildId && startOpen),
  });

  const teacherOptions = useMemo(() => parseTeacherOptions(teachers.data), [teachers.data]);

  const messages = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => listMessages(activeId),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    if (!activeId) return;
    markRead(activeId)
      .then(() => qc.invalidateQueries({ queryKey: ["conversations"] }))
      .catch(() => undefined);
  }, [activeId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data]);

  const send = useMutation({
    mutationFn: () => sendMessage({ conversation_id: activeId, content: draft.trim() }),
    onSuccess: () => {
      setDraft("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được tin nhắn"),
  });

  const start = useMutation({
    mutationFn: () => createDirectConversation({ user_id: teacherId }),
    onSuccess: (conversation) => {
      setStartOpen(false);
      setTeacherId("");
      setError(null);
      setActiveId(conversation.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được cuộc trò chuyện"),
  });

  const list = conversations.data ?? [];
  const active = list.find((c) => c.id === activeId);
  const sortedMessages = [...(messages.data ?? [])].sort((a, b) => a.send_at.localeCompare(b.send_at));

  return (
    <div>
      <PageHeader
        title="Trò chuyện"
        description="Trao đổi trực tiếp với giáo viên của con"
        action={<Button onClick={() => setStartOpen(true)}>+ Bắt đầu trò chuyện</Button>}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <aside className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Cuộc trò chuyện
          </div>
          {conversations.isLoading ? (
            <Loading label="Đang tải…" />
          ) : list.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Chưa có cuộc trò chuyện" description="Bắt đầu trò chuyện với giáo viên của con." />
            </div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {list.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(conversation.id)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                      conversation.id === activeId ? "bg-indigo-50/70" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">
                        {conversationTitle(conversation)}
                      </span>
                      {(conversation.unread_count ?? 0) > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {conversation.last_message?.content ?? "Chưa có tin nhắn"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{formatRelative(conversation.last_message_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-2">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState title="Chọn một cuộc trò chuyện" description="Hoặc bắt đầu trò chuyện mới với giáo viên." />
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{conversationTitle(active)}</p>
                {active.participants && active.participants.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {active.participants
                      .map((p) => p.user?.full_name ?? "Thành viên")
                      .filter((name, index, all) => all.indexOf(name) === index)
                      .join(", ")}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.isLoading ? (
                  <Loading label="Đang tải tin nhắn…" />
                ) : sortedMessages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">Chưa có tin nhắn nào</p>
                ) : (
                  sortedMessages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                        <div className="max-w-[75%]">
                          {!mine && (
                            <p className="mb-0.5 text-[11px] text-slate-500">
                              {message.sender?.full_name ?? "Người dùng"}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line ${
                              mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {message.content}
                          </div>
                          <p className={`mt-0.5 text-[10px] text-slate-400 ${mine ? "text-right" : ""}`}>
                            {formatRelative(message.send_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                className="flex items-end gap-2 border-t border-slate-100 px-4 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) send.mutate();
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nhập tin nhắn…"
                  className="min-h-10 flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (draft.trim()) send.mutate();
                    }
                  }}
                />
                <Button type="submit" loading={send.isPending} disabled={!draft.trim()}>
                  Gửi
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <Modal
        open={startOpen}
        title="Bắt đầu trò chuyện"
        onClose={() => setStartOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Huỷ
            </Button>
            <Button loading={start.isPending} disabled={!teacherId} onClick={() => start.mutate()}>
              Trò chuyện
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Chọn con">
            <Select value={activeChildId} onChange={(e) => setStudentId(e.target.value)}>
              {(children.data ?? []).length === 0 && <option value="">Chưa có thông tin con</option>}
              {(children.data ?? []).map((child) => (
                <option key={child.id} value={child.id}>
                  {child.full_name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Chọn giáo viên" hint={teachers.isError ? "Không tải được danh sách giáo viên" : undefined}>
            {teachers.isLoading ? (
              <Loading label="Đang tải giáo viên…" />
            ) : teacherOptions.length === 0 ? (
              <p className="text-sm text-slate-500">Không có giáo viên nào cho lớp của con.</p>
            ) : (
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">— Chọn giáo viên —</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.userId} value={teacher.userId}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Modal>
    </div>
  );
}
