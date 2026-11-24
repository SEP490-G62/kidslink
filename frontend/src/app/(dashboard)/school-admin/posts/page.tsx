"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import { approvePost, deletePost, listPosts } from "@/lib/services/content";
import { ApiError } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export default function PostsPage() {
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: ["school-admin-posts"], queryFn: () => listPosts("school-admin") });
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending">("all");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["school-admin-posts"] });

  const approve = useMutation({
    mutationFn: (id: string) => approvePost(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không duyệt được bài đăng"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePost("school-admin", id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được bài đăng"),
  });

  const rows = (posts.data ?? []).filter((p) => (tab === "pending" ? p.status === "pending" : true));
  const pendingCount = (posts.data ?? []).filter((p) => p.status === "pending").length;

  return (
    <div>
      <PageHeader title="Bài đăng" description="Kiểm duyệt và quản lý bài đăng của trường" />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <Button variant={tab === "all" ? "primary" : "secondary"} onClick={() => setTab("all")}>
          Tất cả ({posts.data?.length ?? 0})
        </Button>
        <Button variant={tab === "pending" ? "primary" : "secondary"} onClick={() => setTab("pending")}>
          Chờ duyệt ({pendingCount})
        </Button>
      </div>

      {posts.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="Không có bài đăng nào" />
      ) : (
        <div className="space-y-4">
          {rows.map((post) => (
            <article key={post.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {post.user?.full_name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{post.user?.full_name ?? "Người dùng"}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {ROLE_LABEL[(post.user?.role ?? "parent") as Role] ?? post.user?.role}
                    </span>
                    {post.status === "pending" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        Chờ duyệt
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        Đã duyệt
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatRelative(post.createdAt)}</span>
                  </div>

                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{post.content}</p>

                  {post.images && post.images.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {post.images.map((image) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={image.id}
                          src={image.image_url}
                          alt=""
                          className="h-40 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>❤ {post.like_count ?? 0}</span>
                    <span>💬 {post.comment_count ?? 0}</span>
                    <div className="ml-auto flex gap-3">
                      {post.status === "pending" && (
                        <button
                          className="font-medium text-emerald-600 hover:underline"
                          onClick={() => approve.mutate(post.id)}
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => {
                          if (confirm("Xoá bài đăng này?")) remove.mutate(post.id);
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
