package ai.deepclone.documents.entity;

import ai.deepclone.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents an uploaded document that has been indexed for RAG retrieval.
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_doc_user_id", columnList = "user_id"),
        @Index(name = "idx_doc_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String originalFilename;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProcessingStatus status = ProcessingStatus.PENDING;

    @Column
    private String errorMessage;

    /** Total number of chunks this document was split into. */
    @Column(nullable = false)
    @Builder.Default
    private int chunkCount = 0;

    /** Path to the stored file relative to the storage base path. */
    @Column(nullable = false, length = 500)
    private String storagePath;

    /** File size in bytes. */
    @Column
    private long fileSizeBytes;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    @Column
    private Instant processedAt;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DocumentChunk> chunks = new ArrayList<>();

    public enum FileType {
        PDF, DOCX, TXT, MARKDOWN, JSON, CSV, WHATSAPP, TELEGRAM, DISCORD, SLACK, SMS, UNKNOWN
    }

    public enum ProcessingStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
