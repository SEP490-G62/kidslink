package vn.kidslink.api.messaging;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.entity.Message;

/** DTO shapes for the messaging API (JSON keys snake_case via global Jackson config). */
public final class MessagingDtos {

    private MessagingDtos() {
    }

    /** Legacy message shape shared by REST and STOMP payloads. */
    public record MessageDto(
            String id,
            String content,
            String imageUrl,
            Instant sendAt,
            Short readStatus,
            String conversationId,
            UserDto.Summary sender) {

        public static MessageDto from(Message message) {
            if (message == null) {
                return null;
            }
            return new MessageDto(
                    message.getId().toString(),
                    message.getContent(),
                    message.getImageUrl(),
                    message.getSendAt(),
                    message.getReadStatus(),
                    message.getConversation().getId().toString(),
                    UserDto.Summary.from(message.getSender()));
        }
    }

    public record ConversationDto(
            String id,
            String title,
            Instant createAt,
            Instant lastMessageAt,
            String classId,
            String className,
            String academicYear,
            boolean isClassGroup,
            long participantsCount,
            List<UserDto.Summary> participants,
            MessageDto lastMessage) {
    }

    public record CreateConversationRequest(String classId, String title) {
    }

    public record AddParticipantRequest(String userId) {
    }

    public record SendMessageRequest(String conversationId, String content, String imageUrl) {
    }

    public record DirectConversationRequest(String studentId, String teacherUserId, String parentUserId) {
    }

    public record CreateChatGroupRequest(String classId, String title) {
    }

    public record UnreadCountDto(long total, List<UnreadConversationDto> byConversation) {
    }

    public record UnreadConversationDto(String conversationId, long count) {
    }

    public record ClassInfoDto(String id, String className, String academicYear) {

        public static ClassInfoDto from(vn.kidslink.domain.entity.ClassEntity cls) {
            if (cls == null) {
                return null;
            }
            return new ClassInfoDto(cls.getId().toString(), cls.getClassName(), cls.getAcademicYear());
        }
    }

    public record TeacherBriefDto(String teacherId, String userId, String fullName, String avatarUrl, String role) {
    }

    public record StudentBriefDto(String id, String fullName, String avatarUrl) {
    }

    public record ParentBriefDto(String parentId, String userId, String fullName, String avatarUrl,
                                 List<StudentBriefDto> students) {
    }

    public record ClassTeachersDto(@JsonProperty("class") ClassInfoDto classInfo, List<TeacherBriefDto> teachers) {
    }

    public record ClassParentsDto(@JsonProperty("class") ClassInfoDto classInfo, List<ParentBriefDto> parents) {
    }
}
