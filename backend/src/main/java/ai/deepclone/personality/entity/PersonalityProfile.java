package ai.deepclone.personality.entity;

import ai.deepclone.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * The personality profile of the AI clone owner.
 *
 * <p>Every prompt is enriched with this profile so the AI responds in
 * the owner's personal style, tone, and manner.</p>
 */
@Entity
@Table(name = "personality_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalityProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Identity ──
    @Column(length = 100)
    private String displayName;

    @Column(length = 500)
    private String shortBio;

    // ── Greeting / Closing ──
    @Column(length = 200)
    @Builder.Default
    private String greetingStyle = "Hey! How can I help?";

    @Column(length = 200)
    @Builder.Default
    private String closingStyle = "Let me know if you need anything else!";

    // ── Communication Style ──
    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Tone tone = Tone.FRIENDLY;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HumorLevel humor = HumorLevel.MODERATE;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SentenceLength sentenceLength = SentenceLength.MEDIUM;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmojiUsage emojiUsage = EmojiUsage.OCCASIONAL;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TechnicalLevel technicalLevel = TechnicalLevel.HIGH;

    // ── Writing Quirks ──
    @Column(columnDefinition = "TEXT")
    private String vocabulary;                 // comma-separated preferred words

    @Column(columnDefinition = "TEXT")
    private String frequentlyUsedPhrases;      // comma-separated

    @Column(columnDefinition = "TEXT")
    private String wordsToAvoid;               // comma-separated

    @Column(columnDefinition = "TEXT")
    private String writingStructure;           // e.g., "bullet points, concise paragraphs"

    // ── Thinking & Reasoning ──
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String reasoningStyle = "Analytical, step-by-step, thorough";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String codingPhilosophy = "Clean code, SOLID principles, readability over cleverness";

    // ── Custom Instructions ──
    @Column(columnDefinition = "TEXT")
    private String customInstructions;         // freeform instructions injected verbatim

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ── Enums ──

    public enum Tone { PROFESSIONAL, FRIENDLY, CASUAL, DIRECT, EMPATHETIC, HUMOROUS }
    public enum HumorLevel { NONE, SUBTLE, MODERATE, HIGH }
    public enum SentenceLength { SHORT, MEDIUM, LONG, MIXED }
    public enum EmojiUsage { NEVER, OCCASIONAL, FREQUENT }
    public enum TechnicalLevel { LOW, MEDIUM, HIGH, EXPERT }
}
