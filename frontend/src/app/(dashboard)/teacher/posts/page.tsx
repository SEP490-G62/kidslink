"use client";

import { useAuth } from "@/lib/auth-store";
import { FeedPage } from "@/components/feed/feed-page";

export default function TeacherPostsPage() {
  const { user } = useAuth();
  return (
    <FeedPage
      role="teachers"
      title="Bảng tin lớp"
      description="Chia sẻ hoạt động của lớp tới phụ huynh"
      authorName={user?.full_name ?? "Giáo viên"}
      authorAvatar={user?.avatar_url ?? null}
    />
  );
}
