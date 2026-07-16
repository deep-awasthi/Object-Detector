package ai.deepclone.documents.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * A single chunk of a document, stored both in PostgreSQL and Qdrant.
 */
@Entity
@Table(name = "document_chunks", indexes = {
        @Index(name = "idx_chunk_doc_id", columnList = "document_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private UploadedDocument document;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int chunkIndex;

    /** Qdrant vector ID for this chunk. */
    @Column(length = 100)
    private String vectorId;
}
