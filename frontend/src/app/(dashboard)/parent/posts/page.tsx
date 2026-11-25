"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading } from "@/components/ui/feedback";
import {
  createComment,
  createPost,
  deletePost,
  listPosts,
  toggleLike,
} from "@/lib/services/content";
import { ApiError } from "@/lib/api";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

const FEED_KEY = ["parent-posts"] as const;

export default function ParentPostsPage() {
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: FEED_KEY, queryFn: () => listPosts("parent") });

  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: FEED_KEY });

  const publish = useMutation({
    mutationFn: () => createPost("parent", { content }),
    onSuccess: () => {
      setContent("");
      setComposerOpen(false);
      setError(null);
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không đăng được bài viết"),
  });

  const like = useMutation({
    mutationFn: (id: string) => toggleLike("parent", id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không thực hiện được thao tác"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePost("parent", id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được bài đăng"),
  });

  const reply = useMutation({
    mutationFn: (postId: string) => createComment("parent", postId, { contents: comment }),
    onSuccess: () => {
      setComment("");
      setCommenting(null);
      setError(null);
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được bình luận"),
  });

  return (
    <div>
      <PageHeader
        title="Bảng tin"
        description="Thông báo từ nhà trường và chia sẻ từ phụ huynh"
        action={
          <Button onClick={() => setComposerOpen((open) => !open)}>
            {composerOpen ? "Đóng" : "✎ Viết bài"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {composerOpen && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <Field label="Nội dung bài viết" required>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ với nhà trường và các phụ huynh khác…"
            />
          </Field>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setComposerOpen(false)}>
              Huỷ
            </Button>
            <Button
              loading={publish.isPending}
              disabled={!content.trim()}
              onClick={() => publish.mutate()}
            >
              Đăng bài
            </Button>
          </div>
        </div>
      )}

      {posts.isLoading ? (
        <Loading label="Đang tải bảng tin…" />
      ) : posts.isError ? (
        <Alert variant="error">
          {posts.error instanceof ApiError ? posts.error.message : "Không tải được bảng tin"}
        </Alert>
      ) : (posts.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có bài đăng nào" description="Hãy quay lại sau để xem thông báo mới." />
      ) : (
        <div className="space-y-4">
          {(posts.data ?? []).map((post) => (
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
                    {post.school_class?.class_name && (
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700">
                        {post.school_class.class_name}
                      </span>
                    )}
                    {post.status === "pending" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        Chờ duyệt
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

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <button
                      type="button"
                      className={post.liked_by_me ? "font-medium text-rose-600" : "hover:text-rose-600"}
                      onClick={() => like.mutate(post.id)}
                    >
                      {post.liked_by_me ? "❤" : "♡"} {post.like_count ?? 0}
                    </button>
                    <button
                      type="button"
                      className="hover:text-indigo-600"
                      onClick={() => {
                        setCommenting((current) => (current === post.id ? null : post.id));
                        setComment("");
                      }}
                    >
                      💬 {post.comment_count ?? 0} bình luận
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-rose-600 hover:underline"
                      onClick={() => {
                        if (confirm("Xoá bài đăng này?")) remove.mutate(post.id);
                      }}
                    >
                      Xoá
                    </button>
                  </div>

                  {commenting === post.id && (
                    <form
                      className="mt-3 flex items-start gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (comment.trim()) reply.mutate(post.id);
                      }}
                    >
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Viết bình luận…"
                        className="min-h-10 flex-1"
                      />
                      <Button type="submit" loading={reply.isPending} disabled={!comment.trim()}>
                        Gửi
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
