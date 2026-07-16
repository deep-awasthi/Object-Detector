package ai.deepclone.conversation.repository;

import ai.deepclone.conversation.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Page<Conversation> findByUserIdOrderByUpdatedAtDesc(UUID userId, Pageable pageable);

    List<Conversation> findByUserIdAndPinnedTrueOrderByUpdatedAtDesc(UUID userId);

    Optional<Conversation> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            SELECT c FROM Conversation c WHERE c.user.id = :userId
            AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY c.updatedAt DESC
            """)
    Page<Conversation> searchByTitle(UUID userId, String query, Pageable pageable);

    long countByUserId(UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
