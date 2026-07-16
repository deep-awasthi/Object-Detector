package ai.deepclone.memory.service;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.ResourceNotFoundException;
import ai.deepclone.embeddings.EmbeddingService;
import ai.deepclone.memory.entity.Memory;
import ai.deepclone.memory.repository.MemoryRepository;
import ai.deepclone.users.entity.User;
import ai.deepclone.vector.VectorStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Core memory management service.
 *
 * <p>Handles CRUD for memories, automatic embedding indexing in Qdrant,
 * and retrieval of contextually relevant memories for prompt injection.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final VectorStoreService vectorStoreService;
    private final EmbeddingService embeddingService;
    private final DeepCloneProperties properties;

    /**
     * Creates a new memory and asynchronously indexes it in Qdrant.
     */
    @Transactional
    public Memory createMemory(User user, String content, Memory.MemoryType type,
                                int importance, String tags, boolean pinned) {
        Memory memory = Memory.builder()
                .user(user)
                .content(content)
                .type(type)
                .importance(Math.min(importance, properties.getMemory().getMaxImportance()))
                .tags(tags)
                .pinned(pinned)
                .build();
        memory = memoryRepository.save(memory);

        // Asynchronously index in Qdrant
        indexMemoryAsync(memory);
        return memory;
    }

    /**
     * Updates a memory's content and re-indexes its vector.
     */
    @Transactional
    public Memory updateMemory(UUID memoryId, UUID userId, String content,
                                int importance, String tags, boolean pinned) {
        Memory memory = getMemoryForUser(memoryId, userId);
        memory.setContent(content);
        memory.setImportance(importance);
        memory.setTags(tags);
        memory.setPinned(pinned);
        memory = memoryRepository.save(memory);

        // Re-index with updated content
        indexMemoryAsync(memory);
        return memory;
    }

    /**
     * Deletes a memory and removes it from Qdrant.
     */
    @Transactional
    public void deleteMemory(UUID memoryId, UUID userId) {
        Memory memory = getMemoryForUser(memoryId, userId);
        if (memory.getVectorId() != null) {
            vectorStoreService.delete(memory.getVectorId());
        }
        memoryRepository.delete(memory);
        log.info("Deleted memory {} for user {}", memoryId, userId);
    }

    @Transactional(readOnly = true)
    public Page<Memory> listMemories(UUID userId, int page, int size) {
        return memoryRepository.findByUserId(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "importance", "createdAt")));
    }

    @Transactional(readOnly = true)
    public List<Memory> getPinnedMemories(UUID userId) {
        return memoryRepository.findByUserIdAndPinnedTrue(userId);
    }

    @Transactional(readOnly = true)
    public Memory getMemoryForUser(UUID memoryId, UUID userId) {
        Memory memory = memoryRepository.findById(memoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Memory", memoryId));
        if (!memory.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Memory", memoryId);
        }
        return memory;
    }

    /**
     * Retrieves the most relevant memories for the given query using semantic search.
     * Used during prompt construction to inject context.
     */
    public List<String> retrieveRelevantMemories(String query, UUID userId, int topK) {
        try {
            String filterExpression = "userId == '" + userId + "' && contentType == 'memory'";
            List<Document> results = vectorStoreService.searchWithFilter(query, filterExpression, topK);
            return results.stream()
                    .map(Document::getText)
                    .toList();
        } catch (Exception ex) {
            log.warn("Memory retrieval failed, returning empty list: {}", ex.getMessage());
            return List.of();
        }
    }

    @Async("asyncTaskExecutor")
    public void indexMemoryAsync(Memory memory) {
        try {
            Map<String, Object> metadata = Map.of(
                    "userId", memory.getUser().getId().toString(),
                    "memoryId", memory.getId().toString(),
                    "contentType", "memory",
                    "type", memory.getType().name(),
                    "importance", memory.getImportance()
            );
            String vectorId = vectorStoreService.store(memory.getId(), memory.getContent(), metadata);
            memory.setVectorId(vectorId);
            memoryRepository.save(memory);
            log.debug("Indexed memory {} in Qdrant", memory.getId());
        } catch (Exception ex) {
            log.error("Failed to index memory {}: {}", memory.getId(), ex.getMessage());
        }
    }

    public long countMemories(UUID userId) {
        return memoryRepository.countByUserId(userId);
    }
}
