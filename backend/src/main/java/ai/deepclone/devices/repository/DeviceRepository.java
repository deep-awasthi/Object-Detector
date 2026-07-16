package ai.deepclone.devices.repository;

import ai.deepclone.devices.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceRepository extends JpaRepository<Device, UUID> {

    Optional<Device> findByFingerprint(String fingerprint);

    List<Device> findByUserIdOrderByLastSeenAtDesc(UUID userId);

    List<Device> findByUserIdAndWhitelisted(UUID userId, boolean whitelisted);

    boolean existsByFingerprint(String fingerprint);

    @Modifying
    @Query("UPDATE Device d SET d.lastSeenAt = :now, d.lastIpAddress = :ip WHERE d.fingerprint = :fingerprint")
    void updateLastSeen(String fingerprint, Instant now, String ip);

    @Modifying
    @Query("UPDATE Device d SET d.whitelisted = false, d.revokedAt = :now WHERE d.id = :deviceId")
    void revokeDevice(UUID deviceId, Instant now);
}
