package ai.deepclone.security;

import ai.deepclone.auth.entity.RefreshToken;
import ai.deepclone.auth.repository.RefreshTokenRepository;
import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.BusinessException;
import ai.deepclone.devices.entity.Device;
import ai.deepclone.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Manages refresh token lifecycle: creation, rotation, revocation, and cleanup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final DeepCloneProperties properties;

    /**
     * Creates and persists a new refresh token for the given user and device.
     *
     * @return the raw (un-hashed) token string to be returned to the client
     */
    @Transactional
    public String createRefreshToken(User user, Device device) {
        String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        String tokenHash = hash(rawToken);

        Instant expiresAt = Instant.now().plusMillis(properties.getJwt().getRefreshTokenExpiryMs());

        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .device(device)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(entity);
        log.debug("Created refresh token for user {} on device {}", user.getId(), device != null ? device.getId() : "unknown");
        return rawToken;
    }

    /**
     * Validates a raw refresh token, rotates it, and returns the new raw token.
     *
     * @throws BusinessException if token is invalid, expired, or revoked
     */
    @Transactional
    public RotationResult rotateToken(String rawToken) {
        String tokenHash = hash(rawToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Refresh token not found"));

        if (!stored.isValid()) {
            // Possible token reuse attack — revoke ALL tokens for this user
            if (stored.isRevoked()) {
                log.warn("Refresh token reuse detected for user {}. Revoking all sessions.", stored.getUser().getId());
                refreshTokenRepository.revokeAllByUserId(stored.getUser().getId(), Instant.now());
            }
            throw new BusinessException("INVALID_REFRESH_TOKEN", "Refresh token is expired or revoked");
        }

        // Revoke old token
        stored.setRevoked(true);
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        // Issue new token
        String newRawToken = createRefreshToken(stored.getUser(), stored.getDevice());
        return new RotationResult(stored.getUser(), stored.getDevice(), newRawToken);
    }

    @Transactional
    public void revokeAllForUser(UUID userId) {
        int count = refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
        log.debug("Revoked {} refresh tokens for user {}", count, userId);
    }

    @Transactional
    public void revokeAllForDevice(UUID deviceId) {
        int count = refreshTokenRepository.revokeAllByDeviceId(deviceId, Instant.now());
        log.debug("Revoked {} refresh tokens for device {}", count, deviceId);
    }

    /** Scheduled cleanup of expired tokens — runs daily at midnight. */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredBefore(Instant.now());
        log.info("Cleaned up {} expired refresh tokens", deleted);
    }

    private String hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public record RotationResult(User user, Device device, String newRawToken) {}
}
