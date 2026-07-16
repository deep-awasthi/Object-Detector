package ai.deepclone.search.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "A search result item")
public record SearchResult(
        String id,
        String contentType,    // "memory", "conversation", "document"
        String content,
        String title,
        double score,
        Instant createdAt,
        String sourceId        // memory ID, conversation ID, or document ID
) {}
