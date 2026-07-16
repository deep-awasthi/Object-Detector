package ai.deepclone;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Smoke test — verifies the Spring application context loads successfully.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.ai.ollama.base-url=http://localhost:11434",
        "spring.ai.vectorstore.qdrant.host=localhost",
        "spring.ai.vectorstore.qdrant.port=6334",
        "deepclone.jwt.secret=test-secret-that-is-long-enough-for-hs512-algorithm-at-least-64-chars",
})
class DeepCloneAIApplicationTests {

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.ai.vectorstore.VectorStore vectorStore;

    @Test
    void contextLoads() {
        // Verifies that the Spring application context starts without errors
    }
}
