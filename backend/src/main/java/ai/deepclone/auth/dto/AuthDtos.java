package ai.deepclone.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    @Schema(description = "Login request")
    public record LoginRequest(
            @NotBlank @Size(min = 3, max = 50)
            @Schema(description = "Username", example = "deepa") String username,

            @NotBlank @Size(min = 8)
            @Schema(description = "Password") String password,

            @Schema(description = "Optional device name override") String deviceName
    ) {}

    @Schema(description = "Refresh token request")
    public record RefreshRequest(
            @NotBlank @Schema(description = "Refresh token from previous login") String refreshToken
    ) {}

    @Schema(description = "Authentication response containing tokens")
    public record AuthResponse(
            @Schema(description = "JWT access token") String accessToken,
            @Schema(description = "Refresh token") String refreshToken,
            @Schema(description = "Access token expiry in milliseconds") long expiresInMs,
            @Schema(description = "Authenticated user info") UserInfo user
    ) {}

    @Schema(description = "Authenticated user summary")
    public record UserInfo(
            String id,
            String username,
            String email,
            String role
    ) {}

    @Schema(description = "Registration request (first-time setup)")
    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 50) String username,
            @NotBlank @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 128) String password
    ) {}
}
