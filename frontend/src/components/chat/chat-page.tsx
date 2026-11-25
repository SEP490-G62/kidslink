"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import {
  createClassChatGroup,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
} from "@/lib/services/content";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/format";

interface ChatProps {
  title: string;
  description?: string;
  currentUserId: string;
  canCreateClassGroup?: boolean;
}

/** Khung chat dùng chung: danh sách hội thoại + khung tin nhắn (REST, không realtime). */
export function ChatPage({ title, description, currentUserId, canCreateClassGroup }: ChatProps) {
  const qc = useQueryClient();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: listConversations });
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedId = activeId || conversations.data?.[0]?.id || "";

  const messages = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => listMessages(selectedId),
    enabled: Boolean(selectedId),
    refetchInterval: 15_000,
  });

  const send = useMutation({
    mutationFn: () => sendMessage({ conversation_id: selectedId, content: draft.trim() }),
    onSuccess: () => {
      setDraft("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["messages", selectedId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được tin nhắn"),
  });

  const read = useMutation({
    mutationFn: () => markRead(selectedId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const createGroup = useMutation({
    mutationFn: () => createClassChatGroup(),
    onSuccess: (conversation) => {
      setActiveId(conversation.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không tạo được nhóm lớp"),
  });

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={
          canCreateClassGroup ? (
            <Button loading={createGroup.isPending} onClick={() => createGroup.mutate()}>
              Tạo nhóm lớp
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Hội thoại</div>
          {conversations.isLoading ? (
            <Loading label="Đang tải…" />
          ) : (conversations.data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">Chưa có hội thoại nào.</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
              {(conversations.data ?? []).map((conversation) => (
                <li key={conversation.id}>
                  <button
                    className={`w-full px-4 py-3 text-left transition ${
                      conversation.id === selectedId ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveId(conversation.id);
                      read.mutate();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{conversation.title}</span>
                      {(conversation.unread_count ?? 0) > 0 && (
                        <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {conversation.last_message?.content ?? "Chưa có tin nhắn"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">
              {conversations.data?.find((c) => c.id === selectedId)?.title ?? "Chọn hội thoại"}
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["messages", selectedId] });
                qc.invalidateQueries({ queryKey: ["conversations"] });
              }}
            >
              Làm mới
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.isLoading ? (
              <Loading label="Đang tải tin nhắn…" />
            ) : (messages.data ?? []).length === 0 ? (
              <EmptyState title="Chưa có tin nhắn" description="Hãy gửi lời chào đầu tiên." />
            ) : (
              (messages.data ?? []).map((message) => {
                const mine = message.sender_id === currentUserId || message.sender?.id === currentUserId;
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {!mine && (
                        <p className="mb-0.5 text-xs font-semibold opacity-80">
                          {message.sender?.full_name ?? "Người dùng"}
                        </p>
                      )}
                      {message.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.image_url} alt="" className="mb-1 max-h-52 rounded-lg" />
                      )}
                      {message.content && <p className="whitespace-pre-line">{message.content}</p>}
                      <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>
                        {formatRelative(message.send_at)} · {formatDateTime(message.send_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  className="min-h-12"
                  value={draft}
                  placeholder="Nhập tin nhắn…"
                  onChange={(e) => setDraft(e.target.value)}
                />
              </div>
              <Button
                loading={send.isPending}
                disabled={!draft.trim() || !selectedId}
                onClick={() => send.mutate()}
              >
                Gửi
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
