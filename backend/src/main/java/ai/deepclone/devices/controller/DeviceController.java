package ai.deepclone.devices.controller;

import ai.deepclone.devices.entity.Device;
import ai.deepclone.devices.repository.DeviceRepository;
import ai.deepclone.security.RefreshTokenService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Device management REST API.
 */
@Tag(name = "Devices", description = "Manage registered devices and their whitelist status")
@RestController
@RequestMapping("/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceRepository deviceRepository;
    private final RefreshTokenService refreshTokenService;

    @Operation(summary = "List registered devices")
    @GetMapping
    public ResponseEntity<List<Device>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(deviceRepository.findByUserIdOrderByLastSeenAtDesc(user.getId()));
    }

    @Operation(summary = "Revoke a device (blocks all its tokens)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        deviceRepository.revokeDevice(id, Instant.now());
        refreshTokenService.revokeAllForDevice(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Whitelist a previously revoked device")
    @PostMapping("/{id}/whitelist")
    public ResponseEntity<Device> whitelist(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        Device device = deviceRepository.findById(id)
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .orElseThrow();
        device.setWhitelisted(true);
        device.setRevokedAt(null);
        return ResponseEntity.ok(deviceRepository.save(device));
    }
}
