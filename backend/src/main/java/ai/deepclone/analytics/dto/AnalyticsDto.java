package ai.deepclone.analytics.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class AnalyticsDto {

    @Schema(description = "Dashboard analytics summary")
    public record Summary(
            long totalConversations,
            long totalMessages,
            long totalMemories,
            long totalDocuments,
            long totalTokensUsed,
            double averageLatencyMs,
            long embeddingCount,
            ModelUsage topModel
    ) {}

    public record ModelUsage(String modelId, long messageCount) {}
}
