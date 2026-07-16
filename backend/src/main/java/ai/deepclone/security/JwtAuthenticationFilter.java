package ai.deepclone.security;

import ai.deepclone.users.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT authentication filter — runs once per request before Spring Security's authorization.
 *
 * <p>Extracts the Bearer token from the Authorization header, validates it,
 * checks the device whitelist, then populates the {@link SecurityContextHolder}.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final DeviceService deviceService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Set request ID in MDC for structured logging
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        response.setHeader("X-Request-ID", requestId);

        try {
            String token = extractBearerToken(request);

            if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                authenticateRequest(token, request);
            }

            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }

    private void authenticateRequest(String token, HttpServletRequest request) {
        try {
            String username = jwtService.extractUsername(token);
            String deviceFingerprint = jwtService.extractDeviceFingerprint(token);

            if (username == null) return;

            UserDetails userDetails = userRepository.findByUsername(username).orElse(null);
            if (userDetails == null) return;

            // Validate token signature and expiry
            if (!jwtService.isTokenValid(token, userDetails)) {
                log.warn("Invalid JWT token for user: {}", username);
                return;
            }

            // Validate device whitelist
            if (deviceFingerprint != null && !deviceService.isDeviceAllowed(deviceFingerprint)) {
                log.warn("Device not whitelisted for user {}: fingerprint={}", username, deviceFingerprint);
                return;
            }

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (JwtException ex) {
            log.warn("JWT processing error: {}", ex.getMessage());
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }
}
