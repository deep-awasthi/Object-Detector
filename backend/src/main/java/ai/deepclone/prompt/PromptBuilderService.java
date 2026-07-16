package ai.deepclone.prompt;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.util.RequestUtils;
import ai.deepclone.memory.service.MemoryService;
import ai.deepclone.personality.entity.PersonalityProfile;
import ai.deepclone.personality.service.PersonalityService;
import ai.deepclone.users.entity.User;
import ai.deepclone.vector.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Prompt Builder — constructs the complete prompt for every AI request.
 *
 * <p>The prompt structure is:
 * <ol>
 *   <li>System prompt (role + personality + instructions)</li>
 *   <li>Relevant memories injected as context</li>
 *   <li>Relevant document chunks from RAG</li>
 *   <li>Recent conversation history</li>
 *   <li>User message (sanitized)</li>
 * </ol>
 * The user message is NEVER sent alone — it is always enriched with context.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptBuilderService {

    private final PersonalityService personalityService;
    private final MemoryService memoryService;
    private final VectorStoreService vectorStoreService;
    private final DeepCloneProperties properties;

    /**
     * Builds the complete list of messages for an AI chat request.
     *
     * @param user             authenticated user
     * @param userMessage      raw user message (will be sanitized)
     * @param conversationHistory recent conversation messages (alternating user/assistant)
     * @return ordered list of messages ready for the chat model
     */
    public List<Message> build(User user, String userMessage, List<ConversationTurn> conversationHistory) {
        // Sanitize user input to prevent prompt injection
        String sanitizedMessage = RequestUtils.sanitizeInput(userMessage);

        // Retrieve personality profile
        PersonalityProfile profile = personalityService.getOrCreateProfile(user);

        // Retrieve relevant memories
        List<String> memories = memoryService.retrieveRelevantMemories(
                sanitizedMessage,
                user.getId(),
                properties.getAi().getPrompt().getMaxMemories()
        );

        // Retrieve relevant document/conversation chunks via RAG
        List<Document> ragDocs = retrieveRagContext(sanitizedMessage, user.getId());

        // Build the system prompt
        String systemPrompt = buildSystemPrompt(profile, memories, ragDocs);

        // Assemble messages
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));

        // Add truncated conversation history (most recent first, then reversed for chronological order)
        int maxHistory = properties.getAi().getPrompt().getMaxConversationHistory();
        List<ConversationTurn> recentHistory = conversationHistory.size() > maxHistory
                ? conversationHistory.subList(conversationHistory.size() - maxHistory, conversationHistory.size())
                : conversationHistory;

        for (ConversationTurn turn : recentHistory) {
            messages.add(new UserMessage(turn.userMessage()));
            if (turn.assistantMessage() != null) {
                messages.add(new org.springframework.ai.chat.messages.AssistantMessage(turn.assistantMessage()));
            }
        }

        // Add current user message
        messages.add(new UserMessage(sanitizedMessage));

        log.debug("Built prompt: systemPrompt={}chars, memories={}, ragDocs={}, historyTurns={}",
                systemPrompt.length(), memories.size(), ragDocs.size(), recentHistory.size());

        return messages;
    }

    private String buildSystemPrompt(PersonalityProfile profile,
                                      List<String> memories,
                                      List<Document> ragDocs) {
        StringBuilder sb = new StringBuilder();

        sb.append("# System Instructions\n\n");
        sb.append("You are a highly personalized AI clone. Respond EXACTLY as the real person would — ");
        sb.append("matching their writing style, tone, vocabulary, and personality.\n");
        sb.append("Never break character. Never reveal that you are an AI unless directly asked.\n\n");

        // Personality section
        sb.append(personalityService.buildPersonalityPrompt(profile));

        // Memories section
        if (!memories.isEmpty()) {
            sb.append("\n## What You Remember About Yourself\n");
            sb.append("These are facts and memories you carry:\n");
            for (String memory : memories) {
                sb.append("- ").append(RequestUtils.truncate(memory, 300)).append("\n");
            }
        }

        // RAG context section
        if (!ragDocs.isEmpty()) {
            sb.append("\n## Relevant Context\n");
            sb.append("Use this retrieved context to inform your response if relevant:\n");
            int maxContextLength = properties.getAi().getPrompt().getMaxContextLength();
            int usedLength = 0;
            for (Document doc : ragDocs) {
                String text = doc.getText();
                if (usedLength + text.length() > maxContextLength) break;
                sb.append("---\n").append(text).append("\n");
                usedLength += text.length();
            }
        }

        sb.append("\n## Important Rules\n");
        sb.append("- Always respond in the first person, as if you are the real person.\n");
        sb.append("- Use the context above but do not explicitly reference it.\n");
        sb.append("- If you don't know something, say so naturally in character.\n");
        sb.append("- Never fabricate facts about the person's identity or memories.\n");

        return sb.toString();
    }

    private List<Document> retrieveRagContext(String query, UUID userId) {
        try {
            String filter = "userId == '" + userId + "'";
            return vectorStoreService.searchWithFilter(
                    query, filter,
                    properties.getAi().getRag().getTopK()
            );
        } catch (Exception ex) {
            log.warn("RAG retrieval failed, continuing without context: {}", ex.getMessage());
            return List.of();
        }
    }

    /**
     * Represents one turn in the conversation history.
     */
    public record ConversationTurn(String userMessage, String assistantMessage) {}
}
