package ai.deepclone.conversation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A single message in a conversation — either from the user or the AI assistant.
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_msg_conversation_id", columnList = "conversation_id"),
        @Index(name = "idx_msg_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Time taken for the AI to generate this response, in milliseconds. */
    @Column
    private Long latencyMs;

    /** Approximate token count for this message. */
    @Column
    @Builder.Default
    private int tokenCount = 0;

    /** The prompt version/hash used to generate this response — for auditing. */
    @Column(length = 64)
    private String promptVersion;

    /** Comma-separated list of memory IDs retrieved for this message. */
    @Column(columnDefinition = "TEXT")
    private String retrievedMemoryIds;

    /** The model used to generate this response. */
    @Column(length = 100)
    private String model;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum Role {
        USER, ASSISTANT, SYSTEM
    }
}
