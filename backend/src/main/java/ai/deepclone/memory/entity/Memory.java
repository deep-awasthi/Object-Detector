package ai.deepclone.memory.entity;

import ai.deepclone.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A memory is a piece of information about the owner that the AI clone remembers.
 *
 * <p>Memories can be permanent (never expire), temporary (expire after a time),
 * or conversation-scoped (relevant only to one session).
 * They are stored in PostgreSQL and also indexed in Qdrant for semantic retrieval.</p>
 */
@Entity
@Table(name = "memories", indexes = {
        @Index(name = "idx_memories_user_id", columnList = "user_id"),
        @Index(name = "idx_memories_type", columnList = "type"),
        @Index(name = "idx_memories_pinned", columnList = "pinned")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Memory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MemoryType type = MemoryType.PERMANENT;

    /**
     * Importance score 1–10 used for ranking during retrieval.
     */
    @Column(nullable = false)
    @Builder.Default
    private int importance = 5;

    /**
     * Optional comma-separated tags for filtering.
     */
    @Column(length = 500)
    private String tags;

    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    /**
     * Reference to the Qdrant vector ID for this memory.
     */
    @Column(length = 100)
    private String vectorId;

    /**
     * Optional: ID of the conversation this memory was extracted from.
     */
    @Column
    private UUID sourceConversationId;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /** For TEMPORARY memories — null means no expiry. */
    @Column
    private Instant expiresAt;

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public enum MemoryType {
        PERMANENT,      // Never expires — core facts about the owner
        TEMPORARY,      // Expires after a set time
        CONVERSATION,   // Extracted from a single conversation
        PREFERENCE,     // User preference (favorite tools, food, etc.)
        INTEREST        // Topics the owner is interested in
    }
}
