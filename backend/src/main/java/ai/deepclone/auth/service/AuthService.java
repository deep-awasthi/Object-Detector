package ai.deepclone.auth.service;

import ai.deepclone.auth.dto.AuthDtos;
import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.BusinessException;
import ai.deepclone.devices.entity.Device;
import ai.deepclone.security.DeviceService;
import ai.deepclone.security.JwtService;
import ai.deepclone.security.RefreshTokenService;
import ai.deepclone.users.entity.User;
import ai.deepclone.users.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Authentication service handling login, registration, token refresh, and logout.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final DeviceService deviceService;
    private final PasswordEncoder passwordEncoder;
    private final DeepCloneProperties properties;

    /**
     * Authenticates a user, registers/updates their device, and issues tokens.
     */
    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        // Authenticate credentials — throws BadCredentialsException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BusinessException("User not found after authentication"));

        // Register or update device
        Device device = deviceService.registerOrUpdateDevice(user, httpRequest);

        // Update last login timestamp
        userRepository.updateLastLogin(user.getId(), Instant.now());

        return buildAuthResponse(user, device);
    }

    /**
     * Registers the first (owner) user. Only allowed if no users exist yet.
     */
    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.count() > 0) {
            throw new BusinessException("REGISTRATION_CLOSED",
                    "Registration is closed. DeepCloneAI is a single-owner system.");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException("USERNAME_TAKEN", "Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("EMAIL_TAKEN", "Email is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(User.Role.OWNER)
                .build();
        user = userRepository.save(user);
        log.info("Owner account created: {}", user.getUsername());

        Device device = deviceService.registerOrUpdateDevice(user, httpRequest);
        return buildAuthResponse(user, device);
    }

    /**
     * Refreshes tokens using a valid refresh token (rotation).
     */
    @Transactional
    public AuthDtos.AuthResponse refresh(AuthDtos.RefreshRequest request) {
        RefreshTokenService.RotationResult result = refreshTokenService.rotateToken(request.refreshToken());
        return buildAuthResponse(result.user(), result.device());
    }

    /**
     * Revokes all tokens for the current user, effectively logging out all devices.
     */
    @Transactional
    public void logout(User user) {
        refreshTokenService.revokeAllForUser(user.getId());
        log.info("User {} logged out — all refresh tokens revoked", user.getUsername());
    }

    private AuthDtos.AuthResponse buildAuthResponse(User user, Device device) {
        String fingerprint = device != null ? device.getFingerprint() : "";
        String accessToken = jwtService.generateAccessToken(user, user.getId(), fingerprint);
        String refreshToken = refreshTokenService.createRefreshToken(user, device);

        return new AuthDtos.AuthResponse(
                accessToken,
                refreshToken,
                properties.getJwt().getAccessTokenExpiryMs(),
                new AuthDtos.UserInfo(
                        user.getId().toString(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole().name()
                )
        );
    }
}
