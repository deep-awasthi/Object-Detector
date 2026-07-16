package ai.deepclone.chat.controller;

import ai.deepclone.chat.service.ChatService;
import ai.deepclone.conversation.entity.Conversation;
import ai.deepclone.conversation.entity.Message;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

/**
 * Chat and conversation management REST + SSE endpoints.
 */
@Tag(name = "Chat", description = "Conversation management and AI chat")
@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ── Conversation CRUD ──

    @Operation(summary = "Create conversation")
    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Conversation> createConversation(
            @AuthenticationPrincipal User user,
            @RequestBody CreateConversationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createConversation(user, request.title(), request.model()));
    }

    @Operation(summary = "List conversations")
    @GetMapping("/conversations")
    public ResponseEntity<Page<Conversation>> listConversations(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(chatService.listConversations(user.getId(), page, size));
    }

    @Operation(summary = "Get conversation by ID")
    @GetMapping("/conversations/{id}")
    public ResponseEntity<Conversation> getConversation(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(chatService.getConversation(id, user.getId()));
    }

    @Operation(summary = "Rename conversation")
    @PatchMapping("/conversations/{id}/rename")
    public ResponseEntity<Conversation> renameConversation(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody RenameRequest request
    ) {
        return ResponseEntity.ok(chatService.renameConversation(id, user.getId(), request.title()));
    }

    @Operation(summary = "Toggle pin")
    @PostMapping("/conversations/{id}/pin")
    public ResponseEntity<Conversation> togglePin(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(chatService.togglePin(id, user.getId()));
    }

    @Operation(summary = "Delete conversation")
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        chatService.deleteConversation(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Search conversations by title")
    @GetMapping("/conversations/search")
    public ResponseEntity<Page<Conversation>> searchConversations(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(chatService.searchConversations(user.getId(), q, page, size));
    }

    @Operation(summary = "Get messages in conversation")
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(chatService.getMessages(id, user.getId()));
    }

    @Operation(summary = "Export conversation as Markdown")
    @GetMapping("/conversations/{id}/export")
    public ResponseEntity<String> exportConversation(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_MARKDOWN)
                .body(chatService.exportConversation(id, user.getId()));
    }

    // ── Streaming Chat ──

    /**
     * SSE streaming endpoint for AI chat responses.
     * Returns a Flux of text/event-stream chunks.
     */
    @Operation(summary = "Send message and stream response")
    @PostMapping(value = "/conversations/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamMessage(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return chatService.sendMessage(id, user.getId(), request.message(), request.model());
    }

    // ── Request DTOs ──

    public record CreateConversationRequest(String title, String model) {}
    public record RenameRequest(@NotBlank @Size(max = 255) String title) {}
    public record SendMessageRequest(
            @NotBlank @Size(max = 32768) String message,
            String model
    ) {}
}
