package ai.deepclone.search.service;

import ai.deepclone.memory.repository.MemoryRepository;
import ai.deepclone.search.dto.SearchResult;
import ai.deepclone.vector.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Hybrid search service combining semantic (Qdrant) and keyword (PostgreSQL) search.
 *
 * <p>Results from both approaches are merged and de-duplicated, with semantic
 * results ranked higher than keyword matches.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final VectorStoreService vectorStoreService;
    private final MemoryRepository memoryRepository;

    public enum SearchScope { ALL, MEMORIES, CONVERSATIONS, DOCUMENTS }

    /**
     * Performs hybrid search: semantic search via Qdrant + keyword search via PostgreSQL.
     * Results are merged, de-duplicated, and returned ranked by relevance.
     */
    public List<SearchResult> search(UUID userId, String query, SearchScope scope, int limit) {
        List<SearchResult> results = new ArrayList<>();

        // Semantic search via Qdrant
        try {
            String filter = buildFilter(userId, scope);
            List<Document> semanticResults = vectorStoreService.searchWithFilter(query, filter, limit);
            semanticResults.forEach(doc -> results.add(toSearchResult(doc)));
        } catch (Exception ex) {
            log.warn("Semantic search failed: {}", ex.getMessage());
        }

        // Keyword search via PostgreSQL for memories
        if (scope == SearchScope.ALL || scope == SearchScope.MEMORIES) {
            try {
                memoryRepository.searchByContent(userId, query, PageRequest.of(0, limit))
                        .getContent()
                        .forEach(memory -> {
                            // Only add if not already in results
                            boolean alreadyPresent = results.stream()
                                    .anyMatch(r -> r.sourceId().equals(memory.getId().toString()));
                            if (!alreadyPresent) {
                                results.add(new SearchResult(
                                        memory.getId().toString(),
                                        "memory",
                                        memory.getContent(),
                                        "Memory: " + memory.getType().name(),
                                        0.5,  // keyword match score
                                        memory.getCreatedAt(),
                                        memory.getId().toString()
                                ));
                            }
                        });
            } catch (Exception ex) {
                log.warn("Keyword search failed: {}", ex.getMessage());
            }
        }

        // Sort by score descending and limit
        return results.stream()
                .sorted(Comparator.comparingDouble(SearchResult::score).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private String buildFilter(UUID userId, SearchScope scope) {
        String userFilter = "userId == '" + userId + "'";
        return switch (scope) {
            case MEMORIES -> userFilter + " && contentType == 'memory'";
            case CONVERSATIONS -> userFilter + " && contentType == 'conversation'";
            case DOCUMENTS -> userFilter + " && contentType == 'document'";
            default -> userFilter;
        };
    }

    private SearchResult toSearchResult(Document doc) {
        var meta = doc.getMetadata();
        String contentType = (String) meta.getOrDefault("contentType", "unknown");
        String sourceId = (String) meta.getOrDefault("documentId",
                meta.getOrDefault("memoryId",
                        meta.getOrDefault("conversationId", doc.getId())));

        return new SearchResult(
                doc.getId(),
                contentType,
                doc.getText(),
                contentType + ": " + ((String) meta.getOrDefault("filename", sourceId)),
                doc.getScore() != null ? doc.getScore() : 0.0,
                Instant.now(),
                sourceId
        );
    }
}
