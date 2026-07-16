package ai.deepclone.documents.repository;

import ai.deepclone.documents.entity.UploadedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<UploadedDocument, UUID> {

    Page<UploadedDocument> findByUserIdOrderByUploadedAtDesc(UUID userId, Pageable pageable);

    Optional<UploadedDocument> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);

    long countByUserIdAndStatus(UUID userId, UploadedDocument.ProcessingStatus status);
}
