package vn.kidslink.common;

/** Single-error response body: {@code {"error": "..."}}. */
public record ApiError(String error) {
}
