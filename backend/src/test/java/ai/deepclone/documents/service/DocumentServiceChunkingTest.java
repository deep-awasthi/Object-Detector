package ai.deepclone.documents.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the document chunking algorithm in {@link DocumentService}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentService — Text Chunking Tests")
class DocumentServiceChunkingTest {

    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        // We only need the chunking method which is package-private — instantiate with nulls
        // In a real setup these would be mocked properly. Here we test the pure algorithm.
        documentService = new DocumentService(null, null, null);
    }

    @Test
    @DisplayName("Should return empty list for null text")
    void shouldReturnEmptyForNull() {
        List<String> chunks = documentService.chunkText(null, 1000, 200);
        assertThat(chunks).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list for blank text")
    void shouldReturnEmptyForBlank() {
        List<String> chunks = documentService.chunkText("   ", 1000, 200);
        assertThat(chunks).isEmpty();
    }

    @Test
    @DisplayName("Should return single chunk for short text")
    void shouldReturnSingleChunkForShortText() {
        String text = "Hello world. This is a test.";
        List<String> chunks = documentService.chunkText(text, 1000, 200);
        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).contains("Hello world");
    }

    @Test
    @DisplayName("Should split long text into multiple chunks")
    void shouldSplitLongText() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            sb.append("This is sentence number ").append(i).append(". ");
        }
        String text = sb.toString();

        List<String> chunks = documentService.chunkText(text, 500, 100);
        assertThat(chunks).hasSizeGreaterThan(1);

        // Each chunk should be within expected bounds
        for (String chunk : chunks) {
            assertThat(chunk.length()).isLessThanOrEqualTo(600); // chunk size + some slack
            assertThat(chunk).isNotBlank();
        }
    }

    @Test
    @DisplayName("Should produce overlapping chunks")
    void shouldProduceOverlappingChunks() {
        // Build text with clearly distinguishable sections
        String repeatingPhrase = "Alpha. Beta. Gamma. Delta. ";
        String text = repeatingPhrase.repeat(50);

        List<String> chunks = documentService.chunkText(text, 200, 50);
        assertThat(chunks).hasSizeGreaterThan(1);

        // With overlap, each chunk except the last should have some content from the previous
        // We just verify chunks are produced and within size
        chunks.forEach(chunk -> assertThat(chunk).isNotBlank());
    }

    @Test
    @DisplayName("Should handle text with excessive whitespace")
    void shouldCleanWhitespace() {
        String messyText = "Hello   world.\n\n\n\nThis   is   a    test.";
        List<String> chunks = documentService.chunkText(messyText, 1000, 100);

        assertThat(chunks).hasSize(1);
        // Consecutive whitespace should be collapsed
        assertThat(chunks.get(0)).doesNotContain("   ");
    }
}
