package ai.deepclone.security;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link JwtService}.
 */
class JwtServiceTest {

    private DeepCloneProperties properties;
    private JwtService jwtService;

    private static final String TEST_SECRET =
            "test-secret-that-is-long-enough-for-hmac-sha-key-must-be-512-bits-long-abcdefgh";
    private static final long ACCESS_EXPIRY_MS = 900_000L;

    @BeforeEach
    void setUp() {
        properties = new DeepCloneProperties();
        properties.getJwt().setSecret(TEST_SECRET);
        properties.getJwt().setAccessTokenExpiryMs(ACCESS_EXPIRY_MS);
        jwtService = new JwtService(properties);
    }

    private User buildUser(String username) {
        return User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .email(username + "@test.com")
                .passwordHash("hash")
                .role(User.Role.OWNER)
                .build();
    }

    @Test
    @DisplayName("Should generate a valid access token")
    void shouldGenerateAccessToken() {
        User user = buildUser("alice");
        String token = jwtService.generateAccessToken(user, user.getId(), "device-fp-123");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts
    }

    @Test
    @DisplayName("Should extract username from token")
    void shouldExtractUsername() {
        User user = buildUser("alice");
        String token = jwtService.generateAccessToken(user, user.getId(), "fp");

        String extracted = jwtService.extractUsername(token);
        assertThat(extracted).isEqualTo("alice");
    }

    @Test
    @DisplayName("Should extract user ID from token")
    void shouldExtractUserId() {
        User user = buildUser("alice");
        String token = jwtService.generateAccessToken(user, user.getId(), "fp");

        UUID extractedId = jwtService.extractUserId(token);
        assertThat(extractedId).isEqualTo(user.getId());
    }

    @Test
    @DisplayName("Should extract device fingerprint from token")
    void shouldExtractDeviceFingerprint() {
        User user = buildUser("alice");
        String fingerprint = "abc123fingerprint";
        String token = jwtService.generateAccessToken(user, user.getId(), fingerprint);

        String extracted = jwtService.extractDeviceFingerprint(token);
        assertThat(extracted).isEqualTo(fingerprint);
    }

    @Test
    @DisplayName("Should validate token for correct user")
    void shouldValidateTokenForCorrectUser() {
        User user = buildUser("alice");
        String token = jwtService.generateAccessToken(user, user.getId(), "fp");

        boolean valid = jwtService.isTokenValid(token, user);
        assertThat(valid).isTrue();
    }

    @Test
    @DisplayName("Should reject token for wrong user")
    void shouldRejectTokenForWrongUser() {
        User alice = buildUser("alice");
        User bob = buildUser("bob");

        String token = jwtService.generateAccessToken(alice, alice.getId(), "fp");

        boolean valid = jwtService.isTokenValid(token, bob);
        assertThat(valid).isFalse();
    }

    @Test
    @DisplayName("Should detect unexpired token")
    void shouldDetectUnexpiredToken() {
        User user = buildUser("alice");
        String token = jwtService.generateAccessToken(user, user.getId(), "fp");

        assertThat(jwtService.isTokenExpired(token)).isFalse();
    }
}
