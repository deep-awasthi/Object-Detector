package ai.deepclone.vector;

import ai.deepclone.common.config.DeepCloneProperties;
import ai.deepclone.common.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Vector search service backed by Qdrant via Spring AI's {@link VectorStore}.
 *
 * <p>Handles storage and retrieval of semantic vectors for memories, documents,
 * and conversation chunks. All vectors are stored locally in Qdrant.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VectorStoreService {

    private final VectorStore vectorStore;
    private final DeepCloneProperties properties;

    /**
     * Stores a single chunk of text as a vector with metadata.
     *
     * @param id       external ID (e.g., memory UUID or chunk UUID)
     * @param content  text content to embed and store
     * @param metadata arbitrary metadata attached to the vector
     * @return the generated Qdrant document ID
     */
    public String store(UUID id, String content, Map<String, Object> metadata) {
        try {
            Document doc = new Document(id.toString(), content, metadata);
            vectorStore.add(List.of(doc));
            log.debug("Stored vector for id={}", id);
            return id.toString();
        } catch (Exception ex) {
            throw new AiServiceException("Failed to store vector: " + ex.getMessage(), ex);
        }
    }

    /**
     * Stores multiple documents in a single batch operation.
     */
    public void storeBatch(List<Document> documents) {
        if (documents.isEmpty()) return;
        try {
            vectorStore.add(documents);
            log.debug("Stored {} vectors in batch", documents.size());
        } catch (Exception ex) {
            throw new AiServiceException("Batch vector storage failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Performs a semantic similarity search against all stored vectors.
     *
     * @param query     the query text (will be embedded automatically by Spring AI)
     * @param topK      number of results to retrieve
     * @param threshold minimum cosine similarity score (0.0–1.0)
     * @return list of matching documents ordered by relevance
     */
    public List<Document> search(String query, int topK, double threshold) {
        try {
            long start = System.currentTimeMillis();
            SearchRequest request = SearchRequest.builder()
                    .query(query)
                    .topK(topK)
                    .similarityThreshold(threshold)
                    .build();
            List<Document> results = vectorStore.similaritySearch(request);
            log.debug("Vector search '{}' returned {} results in {}ms",
                    query.substring(0, Math.min(50, query.length())),
                    results.size(),
                    System.currentTimeMillis() - start);
            return results;
        } catch (Exception ex) {
            throw new AiServiceException("Vector search failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Semantic search with default RAG parameters from configuration.
     */
    public List<Document> search(String query) {
        return search(query,
                properties.getAi().getRag().getTopK(),
                properties.getAi().getRag().getSimilarityThreshold());
    }

    /**
     * Searches with a metadata filter (e.g., restrict to a specific content type).
     */
    public List<Document> searchWithFilter(String query, String filterExpression, int topK) {
        try {
            SearchRequest request = SearchRequest.builder()
                    .query(query)
                    .topK(topK)
                    .filterExpression(filterExpression)
                    .build();
            return vectorStore.similaritySearch(request);
        } catch (Exception ex) {
            throw new AiServiceException("Filtered vector search failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Deletes a vector by its document ID.
     */
    public void delete(String vectorId) {
        try {
            vectorStore.delete(List.of(vectorId));
            log.debug("Deleted vector id={}", vectorId);
        } catch (Exception ex) {
            log.warn("Failed to delete vector id={}: {}", vectorId, ex.getMessage());
        }
    }

    /**
     * Deletes multiple vectors by their document IDs.
     */
    public void deleteBatch(List<String> vectorIds) {
        if (vectorIds.isEmpty()) return;
        try {
            vectorStore.delete(vectorIds);
            log.debug("Deleted {} vectors", vectorIds.size());
        } catch (Exception ex) {
            log.warn("Batch vector deletion partially failed: {}", ex.getMessage());
        }
    }
}
