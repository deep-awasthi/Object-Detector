package ai.deepclone.search.controller;

import ai.deepclone.search.dto.SearchResult;
import ai.deepclone.search.service.SearchService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Unified search API across memories, conversations, and documents.
 */
@Tag(name = "Search", description = "Semantic and keyword search across all content")
@RestController
@RequestMapping("/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @Operation(summary = "Search across all content (hybrid semantic + keyword)")
    @GetMapping
    public ResponseEntity<List<SearchResult>> search(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(defaultValue = "ALL") SearchService.SearchScope scope,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(searchService.search(user.getId(), q, scope, limit));
    }
}
