package ai.deepclone.analytics.service;

import ai.deepclone.analytics.dto.AnalyticsDto;
import ai.deepclone.conversation.repository.ConversationRepository;
import ai.deepclone.conversation.repository.MessageRepository;
import ai.deepclone.documents.repository.DocumentRepository;
import ai.deepclone.memory.repository.MemoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Analytics service aggregating usage statistics across all modules.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MemoryRepository memoryRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.Summary getSummary(UUID userId) {
        long totalConversations = conversationRepository.countByUserId(userId);
        long totalMemories = memoryRepository.countByUserId(userId);
        long totalDocuments = documentRepository.countByUserId(userId);

        Long totalTokens = messageRepository.sumTokensByUserId(userId);
        Double avgLatency = messageRepository.avgLatencyByUserId(userId);

        return new AnalyticsDto.Summary(
                totalConversations,
                0L,                                         // messages count (simplified)
                totalMemories,
                totalDocuments,
                totalTokens != null ? totalTokens : 0L,
                avgLatency != null ? avgLatency : 0.0,
                0L,                                         // embedding count (from Qdrant stats)
                null                                         // top model (from message query)
        );
    }
}
