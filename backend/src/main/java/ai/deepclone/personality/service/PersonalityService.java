package ai.deepclone.personality.service;

import ai.deepclone.personality.entity.PersonalityProfile;
import ai.deepclone.personality.repository.PersonalityProfileRepository;
import ai.deepclone.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Manages personality profile CRUD and system prompt generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonalityService {

    private final PersonalityProfileRepository profileRepository;

    /**
     * Returns the user's personality profile, creating a default one if absent.
     */
    @Transactional
    public PersonalityProfile getOrCreateProfile(User user) {
        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    PersonalityProfile profile = PersonalityProfile.builder()
                            .user(user)
                            .displayName(user.getUsername())
                            .build();
                    return profileRepository.save(profile);
                });
    }

    @Transactional(readOnly = true)
    public Optional<PersonalityProfile> findByUserId(UUID userId) {
        return profileRepository.findByUserId(userId);
    }

    @Transactional
    public PersonalityProfile save(PersonalityProfile profile) {
        return profileRepository.save(profile);
    }

    /**
     * Generates the personality section of the system prompt from the profile.
     *
     * <p>This text is injected at the top of every prompt to ensure the AI
     * always responds in the owner's personal style.</p>
     */
    public String buildPersonalityPrompt(PersonalityProfile profile) {
        StringBuilder sb = new StringBuilder();

        sb.append("## Your Identity\n");
        sb.append("You are an AI clone of ").append(profile.getDisplayName() != null ? profile.getDisplayName() : "the owner").append(".\n");

        if (profile.getShortBio() != null && !profile.getShortBio().isBlank()) {
            sb.append("About you: ").append(profile.getShortBio()).append("\n");
        }

        sb.append("\n## Communication Style\n");
        sb.append("- Tone: ").append(profile.getTone().name().toLowerCase()).append("\n");
        sb.append("- Humor level: ").append(profile.getHumor().name().toLowerCase()).append("\n");
        sb.append("- Sentence length: ").append(profile.getSentenceLength().name().toLowerCase()).append("\n");
        sb.append("- Emoji usage: ").append(profile.getEmojiUsage().name().toLowerCase()).append("\n");
        sb.append("- Technical level: ").append(profile.getTechnicalLevel().name().toLowerCase()).append("\n");

        if (profile.getGreetingStyle() != null) {
            sb.append("- Typical greeting: \"").append(profile.getGreetingStyle()).append("\"\n");
        }
        if (profile.getClosingStyle() != null) {
            sb.append("- Typical closing: \"").append(profile.getClosingStyle()).append("\"\n");
        }

        if (profile.getFrequentlyUsedPhrases() != null && !profile.getFrequentlyUsedPhrases().isBlank()) {
            sb.append("- Frequently used phrases: ").append(profile.getFrequentlyUsedPhrases()).append("\n");
        }
        if (profile.getWordsToAvoid() != null && !profile.getWordsToAvoid().isBlank()) {
            sb.append("- Avoid these words: ").append(profile.getWordsToAvoid()).append("\n");
        }
        if (profile.getWritingStructure() != null && !profile.getWritingStructure().isBlank()) {
            sb.append("- Writing structure preference: ").append(profile.getWritingStructure()).append("\n");
        }

        sb.append("\n## Reasoning & Philosophy\n");
        if (profile.getReasoningStyle() != null) {
            sb.append("- Reasoning style: ").append(profile.getReasoningStyle()).append("\n");
        }
        if (profile.getCodingPhilosophy() != null) {
            sb.append("- Coding philosophy: ").append(profile.getCodingPhilosophy()).append("\n");
        }

        if (profile.getCustomInstructions() != null && !profile.getCustomInstructions().isBlank()) {
            sb.append("\n## Custom Instructions\n");
            sb.append(profile.getCustomInstructions()).append("\n");
        }

        return sb.toString();
    }
}
