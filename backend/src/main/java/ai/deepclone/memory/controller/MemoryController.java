package ai.deepclone.memory.controller;

import ai.deepclone.memory.entity.Memory;
import ai.deepclone.memory.service.MemoryService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Memory management REST API.
 */
@Tag(name = "Memories", description = "Create, read, update, delete, and search memories")
@RestController
@RequestMapping("/v1/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;

    @Operation(summary = "Create a memory")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Memory> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateMemoryRequest request
    ) {
        Memory memory = memoryService.createMemory(user, request.content(), request.type(),
                request.importance(), request.tags(), request.pinned());
        return ResponseEntity.status(HttpStatus.CREATED).body(memory);
    }

    @Operation(summary = "List all memories")
    @GetMapping
    public ResponseEntity<Page<Memory>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(memoryService.listMemories(user.getId(), page, size));
    }

    @Operation(summary = "Get pinned memories")
    @GetMapping("/pinned")
    public ResponseEntity<List<Memory>> getPinned(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memoryService.getPinnedMemories(user.getId()));
    }

    @Operation(summary = "Get a specific memory")
    @GetMapping("/{id}")
    public ResponseEntity<Memory> get(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(memoryService.getMemoryForUser(id, user.getId()));
    }

    @Operation(summary = "Update a memory")
    @PutMapping("/{id}")
    public ResponseEntity<Memory> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMemoryRequest request
    ) {
        Memory memory = memoryService.updateMemory(id, user.getId(), request.content(),
                request.importance(), request.tags(), request.pinned());
        return ResponseEntity.ok(memory);
    }

    @Operation(summary = "Delete a memory")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        memoryService.deleteMemory(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    // ── Request DTOs ──

    public record CreateMemoryRequest(
            @NotBlank @Size(max = 5000) String content,
            Memory.MemoryType type,
            @Min(1) @Max(10) int importance,
            @Size(max = 500) String tags,
            boolean pinned
    ) {}

    public record UpdateMemoryRequest(
            @NotBlank @Size(max = 5000) String content,
            @Min(1) @Max(10) int importance,
            @Size(max = 500) String tags,
            boolean pinned
    ) {}
}
