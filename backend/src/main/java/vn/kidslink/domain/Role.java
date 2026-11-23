package vn.kidslink.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.Getter;

@Getter
public enum Role {
    ADMIN("admin"),
    SCHOOL_ADMIN("school_admin"),
    TEACHER("teacher"),
    PARENT("parent"),
    HEALTH_CARE_STAFF("health_care_staff"),
    NUTRITION_STAFF("nutrition_staff");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public static Role from(String value) {
        for (Role role : values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Vai trò không hợp lệ: " + value);
    }

    /** DB stores roles as lowercase strings, matching the legacy system. */
    @jakarta.persistence.Converter
    public static class Converter implements AttributeConverter<Role, String> {
        @Override
        public String convertToDatabaseColumn(Role role) {
            return role == null ? null : role.value;
        }

        @Override
        public Role convertToEntityAttribute(String value) {
            return value == null ? null : Role.from(value);
        }
    }
}
