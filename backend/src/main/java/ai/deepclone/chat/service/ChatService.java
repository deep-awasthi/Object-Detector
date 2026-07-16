package ai.deepclone.chat.service;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.ResourceNotFoundException;
import ai.deepclone.conversation.entity.Conversation;
import ai.deepclone.conversation.entity.Message;
import ai.deepclone.conversation.repository.ConversationRepository;
import ai.deepclone.conversation.repository.MessageRepository;
import ai.deepclone.ollama.OllamaService;
import ai.deepclone.prompt.PromptBuilderService;
import ai.deepclone.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Chat service orchestrating the full AI conversation pipeline.
 *
 * <p>Handles conversation lifecycle (create/rename/delete/pin/export)
 * and the AI response pipeline:
 * prompt building → Ollama inference → response persistence.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PromptBuilderService promptBuilder;
    private final OllamaService ollamaService;
    private final DeepCloneProperties properties;

    // ── Conversation Management ──

    @Transactional
    public Conversation createConversation(User user, String title, String model) {
        Conversation conv = Conversation.builder()
                .user(user)
                .title(title != null ? title : "New Conversation")
                .model(model != null ? model : "qwen2.5:latest")
                .build();
        return conversationRepository.save(conv);
    }

    @Transactional(readOnly = true)
    public Page<Conversation> listConversations(UUID userId, int page, int size) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(
                userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Conversation getConversation(UUID conversationId, UUID userId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", conversationId));
    }

    @Transactional
    public Conversation renameConversation(UUID conversationId, UUID userId, String newTitle) {
        Conversation conv = getConversation(conversationId, userId);
        conv.setTitle(newTitle);
        return conversationRepository.save(conv);
    }

    @Transactional
    public Conversation togglePin(UUID conversationId, UUID userId) {
        Conversation conv = getConversation(conversationId, userId);
        conv.setPinned(!conv.isPinned());
        return conversationRepository.save(conv);
    }

    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        conversationRepository.deleteByIdAndUserId(conversationId, userId);
        log.info("Deleted conversation {} for user {}", conversationId, userId);
    }

    @Transactional(readOnly = true)
    public Page<Conversation> searchConversations(UUID userId, String query, int page, int size) {
        return conversationRepository.searchByTitle(userId, query, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID conversationId, UUID userId) {
        getConversation(conversationId, userId); // Validate ownership
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    // ── AI Chat Pipeline ──

    /**
     * Sends a message and returns a streaming Flux of response chunks.
     * The full response is persisted asynchronously after streaming completes.
     *
     * @param conversationId target conversation
     * @param userId         authenticated user ID
     * @param userMessage    user's raw input
     * @param model          Ollama model override (null = use conversation default)
     * @return Flux of response token chunks
     */
    @Transactional
    public Flux<String> sendMessage(UUID conversationId, UUID userId, String userMessage, String model) {
        Conversation conversation = getConversation(conversationId, userId);
        String activeModel = model != null ? model : conversation.getModel();

        // Persist the user's message immediately
        Message userMsg = Message.builder()
                .conversation(conversation)
                .role(Message.Role.USER)
                .content(userMessage)
                .model(activeModel)
                .build();
        messageRepository.save(userMsg);

        // Build conversation history for the prompt
        List<PromptBuilderService.ConversationTurn> history = buildHistory(conversation);

        // Build complete prompt
        List<org.springframework.ai.chat.messages.Message> prompt =
                promptBuilder.build(conversation.getUser(), userMessage, history);

        long startTime = System.currentTimeMillis();
        StringBuilder fullResponse = new StringBuilder();

        // Stream the response and collect for persistence
        return ollamaService.chatStream(prompt, activeModel)
                .doOnNext(fullResponse::append)
                .doOnComplete(() -> persistAssistantMessage(
                        conversation, fullResponse.toString(), activeModel,
                        System.currentTimeMillis() - startTime
                ))
                .doOnError(ex -> log.error("Streaming error for conversation {}: {}", conversationId, ex.getMessage()));
    }

    /**
     * Builds conversation history from the most recent messages.
     */
    private List<PromptBuilderService.ConversationTurn> buildHistory(Conversation conversation) {
        int maxHistory = properties.getAi().getPrompt().getMaxConversationHistory();
        List<Message> recentMessages = messageRepository.findRecentByConversationId(
                conversation.getId(), PageRequest.of(0, maxHistory * 2));

        // Pair messages into user/assistant turns
        List<PromptBuilderService.ConversationTurn> turns = new java.util.ArrayList<>();
        Message lastUser = null;
        for (Message msg : recentMessages) {
            if (msg.getRole() == Message.Role.USER) {
                lastUser = msg;
            } else if (msg.getRole() == Message.Role.ASSISTANT && lastUser != null) {
                turns.add(new PromptBuilderService.ConversationTurn(lastUser.getContent(), msg.getContent()));
                lastUser = null;
            }
        }
        return turns;
    }

    @Transactional
    public void persistAssistantMessage(Conversation conversation, String content,
                                         String model, long latencyMs) {
        Message assistantMsg = Message.builder()
                .conversation(conversation)
                .role(Message.Role.ASSISTANT)
                .content(content)
                .model(model)
                .latencyMs(latencyMs)
                .tokenCount(estimateTokens(content))
                .build();
        messageRepository.save(assistantMsg);

        // Update conversation totals
        conversation.setTotalTokens(conversation.getTotalTokens() + assistantMsg.getTokenCount());
        conversationRepository.save(conversation);

        log.debug("Persisted assistant message for conversation {} in {}ms", conversation.getId(), latencyMs);
    }

    /**
     * Exports a conversation as structured text.
     */
    @Transactional(readOnly = true)
    public String exportConversation(UUID conversationId, UUID userId) {
        Conversation conv = getConversation(conversationId, userId);
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(conv.getTitle()).append("\n");
        sb.append("Model: ").append(conv.getModel()).append("\n");
        sb.append("Date: ").append(conv.getCreatedAt()).append("\n\n");
        sb.append("---\n\n");

        for (Message msg : messages) {
            sb.append("**").append(msg.getRole().name()).append("**: ");
            sb.append(msg.getContent()).append("\n\n");
        }
        return sb.toString();
    }

    /** Simple token estimation: ~4 chars per token. */
    private int estimateTokens(String text) {
        return text == null ? 0 : text.length() / 4;
    }
}
