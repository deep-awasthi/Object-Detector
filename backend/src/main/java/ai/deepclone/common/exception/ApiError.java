package ai.deepclone.common.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Standard API error response returned for all error conditions.
 */
@Schema(description = "Standard error response")
public record ApiError(
        @Schema(description = "HTTP status code") int status,
        @Schema(description = "Error code identifier") String error,
        @Schema(description = "Human-readable message") String message,
        @Schema(description = "Request path that caused the error") String path,
        @Schema(description = "Timestamp of the error") @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
        @Schema(description = "Field-level validation errors, if any") List<FieldError> fieldErrors
) {
    public record FieldError(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, path, Instant.now(), null);
    }

    public static ApiError withFieldErrors(int status, String error, String message, String path,
                                           List<FieldError> fieldErrors) {
        return new ApiError(status, error, message, path, Instant.now(), fieldErrors);
    }
}
