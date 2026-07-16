package ai.deepclone.devices.entity;

import ai.deepclone.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a registered device that can access the API.
 *
 * <p>Only whitelisted devices are allowed to use valid tokens.
 * Device registration happens automatically on first login from a new device.</p>
 */
@Entity
@Table(name = "devices", indexes = {
        @Index(name = "idx_devices_user_id", columnList = "user_id"),
        @Index(name = "idx_devices_fingerprint", columnList = "fingerprint", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Stable fingerprint derived from User-Agent + IP (hashed) to identify unique devices.
     */
    @Column(nullable = false, unique = true, length = 64)
    private String fingerprint;

    @Column(nullable = false)
    @Builder.Default
    private boolean whitelisted = true;

    @Column(length = 45)
    private String lastIpAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant registeredAt = Instant.now();

    @Column
    private Instant lastSeenAt;

    @Column
    @Builder.Default
    private Instant revokedAt = null;

    public boolean isActive() {
        return whitelisted && revokedAt == null;
    }
}
