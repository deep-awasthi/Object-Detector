package ai.deepclone.ollama;

import ai.deepclone.common.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * Ollama AI service — the sole point of communication with the local Ollama instance.
 *
 * <p>Provides both blocking and streaming chat completions.
 * The Ollama server is never exposed directly to the frontend — all requests
 * flow through this service.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaService {

    private final OllamaChatModel chatModel;

    /**
     * Sends a blocking chat request and returns the full response text.
     *
     * @param messages ordered list of messages (system + history + user)
     * @param model    Ollama model slug (e.g., "qwen2.5:latest")
     * @return complete response text
     */
    public String chat(List<Message> messages, String model) {
        try {
            long start = System.currentTimeMillis();
            ChatClient client = ChatClient.builder(chatModel).build();

            String response = client.prompt()
                    .messages(messages)
                    .options(OllamaOptions.builder().withModel(model).build())
                    .call()
                    .content();

            log.info("Ollama [{}] responded in {}ms", model, System.currentTimeMillis() - start);
            return response;
        } catch (Exception ex) {
            throw new AiServiceException("Ollama chat failed for model " + model + ": " + ex.getMessage(), ex);
        }
    }

    /**
     * Sends a streaming chat request and returns a reactive Flux of token chunks.
     * Used for WebSocket streaming to the frontend.
     *
     * @param messages ordered list of messages
     * @param model    Ollama model slug
     * @return Flux emitting partial response chunks as they are generated
     */
    public Flux<String> chatStream(List<Message> messages, String model) {
        try {
            ChatClient client = ChatClient.builder(chatModel).build();
            return client.prompt()
                    .messages(messages)
                    .options(OllamaOptions.builder().withModel(model).build())
                    .stream()
                    .content();
        } catch (Exception ex) {
            throw new AiServiceException("Ollama streaming failed for model " + model + ": " + ex.getMessage(), ex);
        }
    }

    /**
     * Checks if Ollama is reachable and the default model is available.
     */
    public boolean isHealthy() {
        try {
            chat(List.of(new org.springframework.ai.chat.messages.UserMessage("ping")), "qwen2.5:latest");
            return true;
        } catch (Exception ex) {
            log.warn("Ollama health check failed: {}", ex.getMessage());
            return false;
        }
    }
}
