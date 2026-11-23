package vn.kidslink.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payloads for the auth endpoints. Field names stay snake_case on the wire
 * (global SNAKE_CASE Jackson strategy) while Java uses camelCase; explicit @JsonProperty is
 * unnecessary because the strategy converts both directions.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public static final String PASSWORD_REGEX =
            "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>])[A-Za-z\\d!@#$%^&*(),.?\":{}|<>]{8,16}$";
    public static final String PASSWORD_MESSAGE =
            "Mật khẩu phải có từ 8-16 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    public static final String PHONE_REGEX = "^((\\+84)|0)(3|5|7|8|9)\\d{8}$";

    public record LoginRequest(
            @NotBlank(message = "username là bắt buộc") String username,
            @NotBlank(message = "password là bắt buộc") String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "full_name là bắt buộc") String fullName,
            @NotBlank(message = "username là bắt buộc") String username,
            @NotBlank(message = "password là bắt buộc")
            @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
            @Size(min = 8, max = 16, message = PASSWORD_MESSAGE)
            String password,
            @NotBlank(message = "role là bắt buộc") String role,
            @NotBlank(message = "email là bắt buộc")
            @Email(message = "email không hợp lệ") String email,
            @NotBlank(message = "phone_number là bắt buộc")
            @Pattern(regexp = PHONE_REGEX, message = "phone_number không hợp lệ (số di động Việt Nam)")
            String phoneNumber,
            String avatarUrl) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "email là bắt buộc")
            @Email(message = "email không hợp lệ") String email) {
    }

    public record LoginResponse(String token, vn.kidslink.common.UserDto user) {
    }
}
