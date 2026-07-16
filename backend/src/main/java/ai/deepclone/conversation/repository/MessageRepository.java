package ai.deepclone.conversation.repository;

import ai.deepclone.conversation.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    List<Message> findRecentByConversationId(UUID conversationId, Pageable pageable);

    long countByConversationId(UUID conversationId);

    @Query("SELECT SUM(m.tokenCount) FROM Message m WHERE m.conversation.user.id = :userId")
    Long sumTokensByUserId(UUID userId);

    @Query("SELECT AVG(m.latencyMs) FROM Message m WHERE m.conversation.user.id = :userId AND m.role = 'ASSISTANT'")
    Double avgLatencyByUserId(UUID userId);
}
