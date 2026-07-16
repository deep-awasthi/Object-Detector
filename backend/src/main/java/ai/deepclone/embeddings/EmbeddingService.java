package ai.deepclone.embeddings;

import ai.deepclone.common.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Embedding service wrapping Spring AI's {@link EmbeddingModel}.
 *
 * <p>Uses Ollama's nomic-embed-text model to generate dense vector embeddings.
 * All embeddings are generated locally — no external API calls are made.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    /**
     * Generates a single embedding vector for the given text.
     *
     * @param text the input text to embed
     * @return float array representing the dense vector
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Cannot embed blank text");
        }
        try {
            long start = System.currentTimeMillis();
            float[] vector = embeddingModel.embed(text);
            log.debug("Embedded {} chars in {}ms (dim={})", text.length(), System.currentTimeMillis() - start, vector.length);
            return vector;
        } catch (Exception ex) {
            throw new AiServiceException("Failed to generate embedding: " + ex.getMessage(), ex);
        }
    }

    /**
     * Generates embeddings for a list of texts in a single batch call.
     *
     * @param texts list of texts to embed
     * @return list of float arrays, one per input text
     */
    public List<float[]> embedBatch(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        try {
            long start = System.currentTimeMillis();
            List<float[]> vectors = texts.stream()
                    .map(this::embed)
                    .toList();
            log.debug("Batch embedded {} texts in {}ms", texts.size(), System.currentTimeMillis() - start);
            return vectors;
        } catch (AiServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiServiceException("Batch embedding failed: " + ex.getMessage(), ex);
        }
    }

    /**
     * Returns the dimension of embeddings produced by the configured model.
     */
    public int getDimension() {
        return embeddingModel.dimensions();
    }
}
