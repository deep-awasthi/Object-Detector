package ai.deepclone.personality.repository;

import ai.deepclone.personality.entity.PersonalityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonalityProfileRepository extends JpaRepository<PersonalityProfile, UUID> {

    Optional<PersonalityProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
