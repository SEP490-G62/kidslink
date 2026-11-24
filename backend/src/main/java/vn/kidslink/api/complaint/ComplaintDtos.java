package vn.kidslink.api.complaint;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import vn.kidslink.domain.entity.Complaint;
import vn.kidslink.domain.entity.ComplaintType;
import vn.kidslink.domain.entity.User;

public final class ComplaintDtos {

    private ComplaintDtos() {
    }

    public record UserBrief(String id, String fullName, String username, String avatarUrl, String role) {
        public static UserBrief from(User user) {
            if (user == null) return null;
            return new UserBrief(
                    user.getId().toString(),
                    user.getFullName(),
                    user.getUsername(),
                    user.getAvatarUrl(),
                    user.getRole() == null ? null : user.getRole().getValue());
        }
    }

    public record ComplaintTypeDto(String id, String name, String description, List<String> category) {
    }

    public record ComplaintDto(
            String id,
            String complaintTypeId,
            String complaintTypeName,
            String schoolId,
            String reason,
            String image,
            String status,
            String response,
            UserBrief user,
            Instant createdAt,
            Instant updatedAt) {

        public static ComplaintDto from(Complaint complaint) {
            return new ComplaintDto(
                    complaint.getId().toString(),
                    complaint.getComplaintType().getId().toString(),
                    complaint.getComplaintTypeName(),
                    complaint.getSchool().getId().toString(),
                    complaint.getReason(),
                    complaint.getImage(),
                    complaint.getStatus(),
                    complaint.getResponse(),
                    UserBrief.from(complaint.getUser()),
                    complaint.getCreatedAt(),
                    complaint.getUpdatedAt());
        }
    }

    public record ComplaintDetailDto(
            String id,
            String complaintTypeId,
            ComplaintTypeDto complaintType,
            String complaintTypeName,
            String schoolId,
            String reason,
            String image,
            String status,
            String response,
            UserBrief user,
            Instant createdAt,
            Instant updatedAt) {

        public static ComplaintDetailDto from(Complaint complaint, ComplaintTypeDto type) {
            return new ComplaintDetailDto(
                    complaint.getId().toString(),
                    complaint.getComplaintType().getId().toString(),
                    type,
                    complaint.getComplaintTypeName(),
                    complaint.getSchool().getId().toString(),
                    complaint.getReason(),
                    complaint.getImage(),
                    complaint.getStatus(),
                    complaint.getResponse(),
                    UserBrief.from(complaint.getUser()),
                    complaint.getCreatedAt(),
                    complaint.getUpdatedAt());
        }
    }

    public record CreateComplaintRequest(String complaintTypeId, String reason, String image) {
    }

    public record RespondRequest(String response) {
    }

    public record ComplaintTypeRequest(String name, String description, Object category) {
    }

    public record StatCounts(long total, long pending, long approved, long rejected) {
    }

    public record ComplaintStats(StatCounts all, StatCounts teacher, StatCounts parent) {
    }

    public static List<String> normalizeCategories(Object category) {
        List<String> raw = switch (category) {
            case null -> List.of();
            case String s -> List.of(s);
            case List<?> list -> list.stream().map(String::valueOf).toList();
            default -> List.of();
        };
        return raw.stream().filter(c -> c.equals("teacher") || c.equals("parent")).distinct().toList();
    }

    public static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
