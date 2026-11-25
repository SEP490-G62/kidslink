"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Loading, Modal } from "@/components/ui/feedback";
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  listComments,
  listPosts,
  toggleLike,
  type FeedRole,
} from "@/lib/services/content";
import { ApiError, uploadFiles } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { Post, PostComment } from "@/lib/types";

interface FeedProps {
  role: FeedRole;
  title: string;
  description?: string;
  authorName: string;
  authorAvatar?: string | null;
  /** Giáo viên/quản trị không cần chờ duyệt hiển thị nhãn nổi bật. */
  showStatusBadge?: boolean;
}

/** Bảng tin dùng chung cho giáo viên, phụ huynh và quản trị trường. */
export function FeedPage({
  role,
  title,
  description,
  authorName,
  authorAvatar,
  showStatusBadge = true,
}: FeedProps) {
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: ["feed", role], queryFn: () => listPosts(role) });

  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["feed", role] });

  const publish = useMutation({
    mutationFn: async () => {
      const imageUrls = files.length ? await uploadFiles(files) : [];
      return createPost(role, { content: content.trim(), image_urls: imageUrls });
    },
    onSuccess: () => {
      setContent("");
      setFiles([]);
      setError(null);
      invalidate();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "Không đăng được bài, vui lòng thử lại."),
  });

  const like = useMutation({
    mutationFn: (id: string) => toggleLike(role, id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không thả tim được"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePost(role, id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được bài"),
  });

  const comments = useQuery({
    queryKey: ["comments", role, commentPost?.id],
    queryFn: () => listComments(role, commentPost?.id ?? ""),
    enabled: Boolean(commentPost),
  });

  const addComment = useMutation({
    mutationFn: () => createComment(role, commentPost?.id ?? "", { contents: commentText.trim() }),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["comments", role, commentPost?.id] });
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không gửi được bình luận"),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deleteComment(role, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", role, commentPost?.id] });
      invalidate();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Không xoá được bình luận"),
  });

  const rows = posts.data ?? [];

  return (
    <div>
      <PageHeader title={title} description={description} />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt={authorName} className="size-10 rounded-full object-cover" />
            ) : (
              authorName.charAt(0)
            )}
          </div>
          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              placeholder="Chia sẻ hoạt động của lớp…"
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="text-xs text-slate-500"
              />
              {files.length > 0 && (
                <span className="text-xs text-slate-500">{files.length} ảnh được chọn</span>
              )}
              <div className="ml-auto">
                <Button
                  loading={publish.isPending}
                  disabled={!content.trim()}
                  onClick={() => publish.mutate()}
                >
                  Đăng bài
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {posts.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có bài đăng" description="Hãy là người đầu tiên chia sẻ!" />
      ) : (
        <div className="space-y-4">
          {rows.map((post) => (
            <article key={post.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {post.user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.user.avatar_url} alt="" className="size-10 object-cover" />
                  ) : (
                    (post.user?.full_name ?? "?").charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{post.user?.full_name ?? "Người dùng"}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {ROLE_LABEL[(post.user?.role ?? "parent") as Role] ?? post.user?.role}
                    </span>
                    {showStatusBadge && post.status === "pending" && (
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
                        <img key={image.id} src={image.image_url} alt="" className="h-44 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs">
                    <button
                      className="font-medium text-slate-500 hover:text-rose-600"
                      onClick={() => like.mutate(post.id)}
                    >
                      ❤ {post.like_count ?? 0}
                    </button>
                    <button
                      className="font-medium text-slate-500 hover:text-indigo-600"
                      onClick={() => {
                        setCommentPost(post);
                        setCommentText("");
                      }}
                    >
                      💬 {post.comment_count ?? 0} bình luận
                    </button>
                    <button
                      className="ml-auto font-medium text-rose-600 hover:underline"
                      onClick={() => {
                        if (confirm("Xoá bài đăng này?")) remove.mutate(post.id);
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(commentPost)}
        title="Bình luận"
        onClose={() => setCommentPost(null)}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setCommentPost(null)}>
              Đóng
            </Button>
            <Button
              loading={addComment.isPending}
              disabled={!commentText.trim()}
              onClick={() => addComment.mutate()}
            >
              Gửi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {comments.isLoading ? (
            <Loading label="Đang tải bình luận…" />
          ) : (comments.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có bình luận nào.</p>
          ) : (
            <ul className="max-h-72 space-y-3 overflow-y-auto">
              {(comments.data ?? []).map((comment: PostComment) => (
                <li key={comment.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">
                      {comment.user?.full_name ?? "Người dùng"}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatRelative(comment.create_at)}</span>
                    <button
                      className="ml-auto text-[10px] text-rose-600 hover:underline"
                      onClick={() => removeComment.mutate(comment.id)}
                    >
                      Xoá
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{comment.contents}</p>
                  {(comment.replies ?? []).map((reply) => (
                    <div key={reply.id} className="mt-2 ml-4 rounded-lg bg-white p-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {reply.user?.full_name ?? "Người dùng"}
                      </span>
                      <p className="text-sm text-slate-600">{reply.contents}</p>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
          <Textarea
            value={commentText}
            placeholder="Viết bình luận…"
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
