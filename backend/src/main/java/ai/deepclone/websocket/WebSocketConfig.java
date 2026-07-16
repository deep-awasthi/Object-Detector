package ai.deepclone.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration using STOMP protocol.
 *
 * <p>Provides real-time bidirectional communication for future features
 * such as collaborative sessions and live memory updates.
 * Streaming AI responses use SSE (Server-Sent Events) rather than WebSocket.</p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for topics and queue
        registry.enableSimpleBroker("/topic", "/queue");
        // Application-level prefix for messages bound to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific destinations
        registry.setUserDestinationPrefix("/user");
    }
}
