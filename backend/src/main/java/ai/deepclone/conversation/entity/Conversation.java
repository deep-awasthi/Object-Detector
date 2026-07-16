package ai.deepclone.conversation.entity;

import ai.deepclone.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A conversation is a named thread of messages between the user and the AI clone.
 */
@Entity
@Table(name = "conversations", indexes = {
        @Index(name = "idx_conv_user_id", columnList = "user_id"),
        @Index(name = "idx_conv_pinned", columnList = "pinned"),
        @Index(name = "idx_conv_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    @Builder.Default
    private String title = "New Conversation";

    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    /** The Ollama model used for this conversation. */
    @Column(nullable = false, length = 100)
    @Builder.Default
    private String model = "qwen2.5:latest";

    /** Total token count across all messages. */
    @Column(nullable = false)
    @Builder.Default
    private long totalTokens = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
