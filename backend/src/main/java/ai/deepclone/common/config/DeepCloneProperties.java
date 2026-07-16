package ai.deepclone.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Strongly-typed configuration properties for DeepCloneAI.
 * All values are externalized via application.yml / environment variables.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "deepclone")
public class DeepCloneProperties {

    private Jwt jwt = new Jwt();
    private Security security = new Security();
    private Storage storage = new Storage();
    private Ai ai = new Ai();
    private Memory memory = new Memory();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpiryMs = 900_000L;        // 15 minutes
        private long refreshTokenExpiryMs = 2_592_000_000L; // 30 days
    }

    @Getter
    @Setter
    public static class Security {
        private List<String> allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173");

        private RateLimit rateLimit = new RateLimit();

        @Getter
        @Setter
        public static class RateLimit {
            private long capacity = 100;
            private long refillTokens = 100;
            private long refillPeriodSeconds = 60;
        }
    }

    @Getter
    @Setter
    public static class Storage {
        private String basePath = "./data/uploads";
    }

    @Getter
    @Setter
    public static class Ai {
        private List<ModelConfig> models = List.of();
        private Rag rag = new Rag();
        private Prompt prompt = new Prompt();

        @Getter
        @Setter
        public static class ModelConfig {
            private String id;
            private String name;
            private String description;
            private boolean isDefault;
        }

        @Getter
        @Setter
        public static class Rag {
            private int topK = 5;
            private double similarityThreshold = 0.7;
        }

        @Getter
        @Setter
        public static class Prompt {
            private int maxContextLength = 6000;
            private int maxMemories = 10;
            private int maxConversationHistory = 20;
        }
    }

    @Getter
    @Setter
    public static class Memory {
        private boolean autoExtract = true;
        private int maxImportance = 10;
    }
}
