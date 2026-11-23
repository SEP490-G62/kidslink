package vn.kidslink.security;

import vn.kidslink.domain.Role;

/**
 * Authenticated caller, resolved from JWT claims (stateless, no DB lookup).
 * Used directly as the Spring Security principal: {@code @AuthenticationPrincipal CurrentUser user}.
 * {@code id} is a UUID string, or the literal {@code "admin"} for the synthetic system admin.
 * {@code schoolId} is null for the system admin.
 */
public record CurrentUser(String id, Role role, String username, String fullName, String schoolId) {
}
