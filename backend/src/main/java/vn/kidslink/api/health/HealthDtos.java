package vn.kidslink.api.health;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.HealthCareStaff;
import vn.kidslink.domain.entity.HealthNotice;
import vn.kidslink.domain.entity.HealthRecord;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.StudentClass;

public final class HealthDtos {

    private HealthDtos() {
    }

    public record StaffBrief(String id, String fullName) {
        public static StaffBrief from(HealthCareStaff staff) {
            if (staff == null) return null;
            return new StaffBrief(staff.getId().toString(), staff.getUser().getFullName());
        }
    }

    public record HealthRecordDto(
            String id,
            LocalDate checkupDate,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String note,
            String studentId,
            StaffBrief healthCareStaff,
            Instant createdAt,
            Instant updatedAt) {

        public static HealthRecordDto from(HealthRecord record) {
            return new HealthRecordDto(
                    record.getId().toString(),
                    record.getCheckupDate(),
                    record.getHeightCm(),
                    record.getWeightKg(),
                    record.getNote(),
                    record.getStudent().getId().toString(),
                    StaffBrief.from(record.getHealthCareStaff()),
                    record.getCreatedAt(),
                    record.getUpdatedAt());
        }
    }

    public record HealthNoticeDto(
            String id,
            String studentId,
            String symptoms,
            String actionsTaken,
            String medications,
            String noticeTime,
            String note,
            StaffBrief healthCareStaff,
            Instant createdAt,
            Instant updatedAt) {

        public static HealthNoticeDto from(HealthNotice notice) {
            return new HealthNoticeDto(
                    notice.getId().toString(),
                    notice.getStudent().getId().toString(),
                    notice.getSymptoms(),
                    notice.getActionsTaken(),
                    notice.getMedications(),
                    notice.getNoticeTime(),
                    notice.getNote(),
                    StaffBrief.from(notice.getHealthCareStaff()),
                    notice.getCreatedAt(),
                    notice.getUpdatedAt());
        }
    }

    public record HealthClassDto(
            String id,
            String className,
            String academicYear,
            String classAgeName,
            String teacherName,
            String coTeacherName,
            LocalDate startDate,
            LocalDate endDate) {

        public static HealthClassDto from(ClassEntity entity) {
            return new HealthClassDto(
                    entity.getId().toString(),
                    entity.getClassName(),
                    entity.getAcademicYear(),
                    entity.getClassAge() == null ? null : entity.getClassAge().getAgeName(),
                    entity.getTeacher() == null ? null : entity.getTeacher().getUser().getFullName(),
                    entity.getCoTeacher() == null ? null : entity.getCoTeacher().getUser().getFullName(),
                    entity.getStartDate(),
                    entity.getEndDate());
        }
    }

    public record HealthStudentDto(
            String id,
            String fullName,
            String avatarUrl,
            LocalDate dob,
            Short gender,
            Short status,
            String allergy,
            java.math.BigDecimal discount) {

        public static HealthStudentDto from(StudentClass sc) {
            Student s = sc.getStudent();
            return new HealthStudentDto(
                    s.getId().toString(),
                    s.getFullName(),
                    s.getAvatarUrl(),
                    s.getDob(),
                    s.getGender(),
                    s.getStatus(),
                    s.getAllergy(),
                    sc.getDiscount());
        }
    }

    public record StaffProfileDto(String id, String qualification, String major, Integer experienceYears, String note) {
        public static StaffProfileDto from(HealthCareStaff staff) {
            return new StaffProfileDto(
                    staff.getId().toString(),
                    staff.getQualification(),
                    staff.getMajor(),
                    staff.getExperienceYears(),
                    staff.getNote());
        }
    }

    public record StaffProfileResponse(vn.kidslink.common.UserDto user, StaffProfileDto staff) {
    }

    public record HealthRecordRequest(LocalDate checkupDate, BigDecimal heightCm, BigDecimal weightKg, String note, String studentId) {
    }

    public record HealthNoticeRequest(
            String studentId, String symptoms, String actionsTaken, String medications, String noticeTime, String note) {
    }

    public record StaffProfileRequest(
            String fullName, String avatarUrl, String email, String phoneNumber,
            String qualification, String major, Integer experienceYears, String note) {
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {
    }


}
