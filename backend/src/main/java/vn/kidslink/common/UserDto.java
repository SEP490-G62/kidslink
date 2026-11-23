package vn.kidslink.common;

import vn.kidslink.domain.entity.User;

/**
 * Legacy {@code user} object shape returned by auth/user endpoints.
 * Snake case keys are produced by {@link com.fasterxml.jackson.databind.PropertyNamingStrategies}.
 */
public record UserDto(
        String id,
        String fullName,
        String username,
        String role,
        String avatarUrl,
        String email,
        String phoneNumber,
        Short status,
        String schoolId,
        String address) {

    public static UserDto from(User user) {
        if (user == null) {
            return null;
        }
        return new UserDto(
                user.getId() == null ? null : user.getId().toString(),
                user.getFullName(),
                user.getUsername(),
                user.getRole() == null ? null : user.getRole().getValue(),
                user.getAvatarUrl(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getStatus(),
                user.getSchool() == null ? null : user.getSchool().getId().toString(),
                user.getAddress());
    }

    /** Minimal shape used inside posts / messages / comments. */
    public record Summary(String id, String fullName, String avatarUrl, String role) {
        public static Summary from(User user) {
            if (user == null) {
                return null;
            }
            return new Summary(
                    user.getId().toString(),
                    user.getFullName(),
                    user.getAvatarUrl(),
                    user.getRole() == null ? null : user.getRole().getValue());
        }
    }
}
