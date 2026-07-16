package ai.deepclone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * DeepCloneAI — Main application entry point.
 *
 * <p>A fully local AI clone platform that learns from a person's conversations,
 * writing style, memories, and documents. No cloud AI APIs are used.</p>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
@EnableCaching
public class DeepCloneAIApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeepCloneAIApplication.class, args);
    }
}
