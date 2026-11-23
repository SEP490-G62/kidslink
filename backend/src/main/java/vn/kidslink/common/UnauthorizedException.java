package vn.kidslink.common;

/** 401 — mapped to {"error": "..."} by the global handler. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
