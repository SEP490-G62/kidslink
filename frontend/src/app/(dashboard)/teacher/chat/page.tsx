"use client";

import { useAuth } from "@/lib/auth-store";
import { ChatPage } from "@/components/chat/chat-page";

export default function TeacherChatPage() {
  const { user } = useAuth();
  return (
    <ChatPage
      title="Trò chuyện"
      description="Nhắn tin với phụ huynh và nhóm lớp"
      currentUserId={user?.id ?? ""}
      canCreateClassGroup
    />
  );
}
