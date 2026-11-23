package vn.kidslink.api.school;

import java.util.List;
import vn.kidslink.domain.entity.School;

public final class SchoolDtos {

    private SchoolDtos() {
    }

    /** Nested PayOS configuration, stored flat in {@code schools.payos_*} columns. */
    public record PayosConfigDto(
            String clientId,
            String apiKey,
            String checksumKey,
            String accountNumber,
            String accountName,
            String bankCode,
            Boolean active,
            String webhookUrl) {
    }

    public record SchoolDto(
            String id,
            String schoolName,
            String address,
            String phone,
            String email,
            String logoUrl,
            Short status,
            String qrData,
            PayosConfigDto payosConfig) {
    }

    /**
     * Create/update payload. Both the nested {@code payos_config} object and the flat
     * {@code payos_*} fields are accepted to stay compatible with the legacy clients.
     */
    public record SchoolRequest(
            String schoolName,
            String address,
            String phone,
            String email,
            String logoUrl,
            Short status,
            String qrData,
            PayosConfigDto payosConfig,
            String payosClientId,
            String payosApiKey,
            String payosChecksumKey,
            String payosAccountNumber,
            String payosAccountName,
            String payosBankCode,
            Boolean payosActive,
            String payosWebhookUrl) {
    }

    public record TeacherOption(String id, String userId, String fullName) {
    }

    public record StudentSummary(
            String id,
            String fullName,
            String dob,
            Short gender,
            String avatarUrl,
            Short status,
            String allergy) {
    }

    public record ClassSummary(
            String id,
            String className,
            String academicYear,
            String classAgeId,
            String teacherId,
            String startDate,
            String endDate,
            Long studentCount) {
    }

    public record ClassAgeDto(String id, Integer age, String ageName, String schoolId) {
    }

    public static SchoolDto toDto(School school) {
        return new SchoolDto(
                school.getId().toString(),
                school.getSchoolName(),
                school.getAddress(),
                school.getPhone(),
                school.getEmail(),
                school.getLogoUrl(),
                school.getStatus(),
                school.getQrData(),
                new PayosConfigDto(
                        school.getPayosClientId(),
                        school.getPayosApiKey(),
                        school.getPayosChecksumKey(),
                        school.getPayosAccountNumber(),
                        school.getPayosAccountName(),
                        school.getPayosBankCode(),
                        school.getPayosActive(),
                        school.getPayosWebhookUrl()));
    }

    static List<String> blankToNull(String... values) {
        return List.of();
    }
}
