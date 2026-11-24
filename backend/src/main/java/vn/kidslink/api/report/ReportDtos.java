package vn.kidslink.api.report;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import vn.kidslink.api.health.HealthDtos;
import vn.kidslink.domain.entity.DailyReport;
import vn.kidslink.domain.entity.Teacher;

public final class ReportDtos {

    private ReportDtos() {
    }

    /** Legacy teacher shape: populated with user full_name + avatar_url. */
    public record TeacherBrief(String id, String fullName, String avatarUrl) {
        public static TeacherBrief from(Teacher teacher) {
            if (teacher == null) return null;
            return new TeacherBrief(
                    teacher.getId().toString(),
                    teacher.getUser().getFullName(),
                    teacher.getUser().getAvatarUrl());
        }
    }

    public record DailyReportDto(
            String id,
            LocalDate reportDate,
            String checkinTime,
            String checkoutTime,
            String comments,
            String studentId,
            TeacherBrief teacherCheckin,
            TeacherBrief teacherCheckout,
            List<HealthDtos.HealthNoticeDto> healthNotices,
            Instant createdAt,
            Instant updatedAt) {

        public static DailyReportDto from(DailyReport report) {
            return from(report, List.of());
        }

        public static DailyReportDto from(DailyReport report, List<HealthDtos.HealthNoticeDto> notices) {
            return new DailyReportDto(
                    report.getId().toString(),
                    report.getReportDate(),
                    report.getCheckinTime(),
                    report.getCheckoutTime(),
                    report.getComments(),
                    report.getStudent().getId().toString(),
                    TeacherBrief.from(report.getTeacherCheckin()),
                    TeacherBrief.from(report.getTeacherCheckout()),
                    notices,
                    report.getCreatedAt(),
                    report.getUpdatedAt());
        }
    }

    public record CheckinRequest(String studentId, LocalDate reportDate) {
    }

    public record CommentRequest(String comments, LocalDate reportDate) {
    }

    public static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
