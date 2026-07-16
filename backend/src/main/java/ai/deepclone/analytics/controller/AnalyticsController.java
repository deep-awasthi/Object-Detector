package ai.deepclone.analytics.controller;

import ai.deepclone.analytics.dto.AnalyticsDto;
import ai.deepclone.analytics.service.AnalyticsService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Analytics REST API providing usage statistics for the dashboard.
 */
@Tag(name = "Analytics", description = "Usage statistics and metrics")
@RestController
@RequestMapping("/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Get dashboard analytics summary")
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsDto.Summary> getSummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getSummary(user.getId()));
    }
}
