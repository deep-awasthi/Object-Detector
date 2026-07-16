package ai.deepclone.security;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.devices.entity.Device;
import ai.deepclone.devices.repository.DeviceRepository;
import ai.deepclone.users.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Manages device registration and whitelist enforcement.
 *
 * <p>A device fingerprint is derived from a combination of User-Agent and IP address.
 * On first login from a new device, the device is automatically registered and whitelisted.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeepCloneProperties properties;

    /**
     * Registers a new device or updates the last-seen time for an existing one.
     *
     * @return the Device entity (created or existing)
     */
    @Transactional
    public Device registerOrUpdateDevice(User user, HttpServletRequest request) {
        String fingerprint = computeFingerprint(request);
        String ipAddress = extractIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String deviceName = deriveDeviceName(userAgent);

        return deviceRepository.findByFingerprint(fingerprint)
                .map(existing -> {
                    deviceRepository.updateLastSeen(fingerprint, Instant.now(), ipAddress);
                    return existing;
                })
                .orElseGet(() -> {
                    Device device = Device.builder()
                            .user(user)
                            .name(deviceName)
                            .fingerprint(fingerprint)
                            .lastIpAddress(ipAddress)
                            .userAgent(userAgent)
                            .whitelisted(true)
                            .lastSeenAt(Instant.now())
                            .build();
                    Device saved = deviceRepository.save(device);
                    log.info("New device registered for user {}: {} ({})", user.getId(), deviceName, fingerprint);
                    return saved;
                });
    }

    /**
     * Checks whether the device identified by the request fingerprint is whitelisted.
     */
    public boolean isDeviceAllowed(String fingerprint) {
        return deviceRepository.findByFingerprint(fingerprint)
                .map(Device::isActive)
                .orElse(false);
    }

    private String computeFingerprint(HttpServletRequest request) {
        String rawValue = extractIpAddress(request) + "|" + request.getHeader("User-Agent");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(rawValue.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String deriveDeviceName(String userAgent) {
        if (userAgent == null) return "Unknown Device";
        if (userAgent.contains("Mobile")) return "Mobile Browser";
        if (userAgent.contains("Tablet")) return "Tablet Browser";
        if (userAgent.contains("Windows")) return "Windows Browser";
        if (userAgent.contains("Mac")) return "Mac Browser";
        if (userAgent.contains("Linux")) return "Linux Browser";
        return "Web Browser";
    }
}
