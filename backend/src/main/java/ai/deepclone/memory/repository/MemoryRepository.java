package ai.deepclone.memory.repository;

import ai.deepclone.memory.entity.Memory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryRepository extends JpaRepository<Memory, UUID> {

    Page<Memory> findByUserId(UUID userId, Pageable pageable);

    List<Memory> findByUserIdAndPinnedTrue(UUID userId);

    List<Memory> findByUserIdAndType(UUID userId, Memory.MemoryType type);

    @Query("SELECT m FROM Memory m WHERE m.user.id = :userId AND m.type != 'TEMPORARY' ORDER BY m.importance DESC, m.createdAt DESC")
    List<Memory> findTopMemoriesForUser(UUID userId, Pageable pageable);

    @Query("SELECT m FROM Memory m WHERE m.user.id = :userId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.importance DESC")
    Page<Memory> searchByContent(UUID userId, String query, Pageable pageable);

    @Query("SELECT m FROM Memory m WHERE m.user.id = :userId AND m.expiresAt IS NOT NULL AND m.expiresAt < CURRENT_TIMESTAMP")
    List<Memory> findExpired(UUID userId);

    long countByUserId(UUID userId);
}
