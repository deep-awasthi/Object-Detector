package ai.deepclone.common.util;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;
import java.util.UUID;

/**
 * Utility methods for request ID tracking and other common operations.
 */
public final class RequestUtils {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String REQUEST_ID_MDC_KEY = "requestId";

    private RequestUtils() {}

    /**
     * Generates or retrieves a unique request ID for tracing.
     */
    public static String resolveRequestId() {
        return Optional.ofNullable(RequestContextHolder.getRequestAttributes())
                .filter(attr -> attr instanceof ServletRequestAttributes)
                .map(attr -> ((ServletRequestAttributes) attr).getRequest())
                .map(req -> req.getHeader(REQUEST_ID_HEADER))
                .filter(id -> !id.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
    }

    /**
     * Sanitizes user input to prevent prompt injection.
     * Strips control characters and trims whitespace.
     */
    public static String sanitizeInput(String input) {
        if (input == null) return null;
        // Remove null bytes and other dangerous control characters
        return input.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "")
                .trim();
    }

    /**
     * Truncates a string to a max length, appending "..." if truncated.
     */
    public static String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }
}
