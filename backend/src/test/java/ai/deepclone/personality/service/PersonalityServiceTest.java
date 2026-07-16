package ai.deepclone.personality.service;

import ai.deepclone.personality.entity.PersonalityProfile;
import ai.deepclone.personality.repository.PersonalityProfileRepository;
import ai.deepclone.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link PersonalityService}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PersonalityService Tests")
class PersonalityServiceTest {

    @Mock
    private PersonalityProfileRepository profileRepository;

    @InjectMocks
    private PersonalityService personalityService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("deepa")
                .email("deepa@test.com")
                .passwordHash("hash")
                .role(User.Role.OWNER)
                .build();
    }

    @Test
    @DisplayName("Should return existing profile when found")
    void shouldReturnExistingProfile() {
        PersonalityProfile existing = PersonalityProfile.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .displayName("Deepa")
                .tone(PersonalityProfile.Tone.FRIENDLY)
                .build();

        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(existing));

        PersonalityProfile result = personalityService.getOrCreateProfile(testUser);

        assertThat(result.getDisplayName()).isEqualTo("Deepa");
        verify(profileRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create default profile when none exists")
    void shouldCreateDefaultProfileWhenAbsent() {
        when(profileRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());
        when(profileRepository.save(any(PersonalityProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        PersonalityProfile result = personalityService.getOrCreateProfile(testUser);

        assertThat(result).isNotNull();
        assertThat(result.getUser()).isEqualTo(testUser);
        assertThat(result.getDisplayName()).isEqualTo(testUser.getUsername());
        verify(profileRepository, times(1)).save(any(PersonalityProfile.class));
    }

    @Test
    @DisplayName("Should build personality prompt containing all key sections")
    void shouldBuildPersonalityPromptWithAllSections() {
        PersonalityProfile profile = PersonalityProfile.builder()
                .user(testUser)
                .displayName("Deepa")
                .shortBio("A software engineer who loves AI")
                .tone(PersonalityProfile.Tone.FRIENDLY)
                .humor(PersonalityProfile.HumorLevel.MODERATE)
                .sentenceLength(PersonalityProfile.SentenceLength.MEDIUM)
                .emojiUsage(PersonalityProfile.EmojiUsage.OCCASIONAL)
                .technicalLevel(PersonalityProfile.TechnicalLevel.HIGH)
                .reasoningStyle("Step-by-step, analytical")
                .codingPhilosophy("Clean code, SOLID")
                .frequentlyUsedPhrases("makes sense, exactly")
                .wordsToAvoid("very, just")
                .customInstructions("Always include examples")
                .build();

        String prompt = personalityService.buildPersonalityPrompt(profile);

        assertThat(prompt).contains("Deepa");
        assertThat(prompt).contains("A software engineer who loves AI");
        assertThat(prompt).contains("friendly");
        assertThat(prompt).contains("moderate");
        assertThat(prompt).contains("Step-by-step, analytical");
        assertThat(prompt).contains("Clean code, SOLID");
        assertThat(prompt).contains("makes sense, exactly");
        assertThat(prompt).contains("very, just");
        assertThat(prompt).contains("Always include examples");
        assertThat(prompt).contains("## Your Identity");
        assertThat(prompt).contains("## Communication Style");
        assertThat(prompt).contains("## Reasoning & Philosophy");
        assertThat(prompt).contains("## Custom Instructions");
    }

    @Test
    @DisplayName("Should build minimal prompt without optional fields")
    void shouldBuildMinimalPromptWithoutOptionalFields() {
        PersonalityProfile profile = PersonalityProfile.builder()
                .user(testUser)
                .tone(PersonalityProfile.Tone.DIRECT)
                .humor(PersonalityProfile.HumorLevel.NONE)
                .sentenceLength(PersonalityProfile.SentenceLength.SHORT)
                .emojiUsage(PersonalityProfile.EmojiUsage.NEVER)
                .technicalLevel(PersonalityProfile.TechnicalLevel.EXPERT)
                .build();

        String prompt = personalityService.buildPersonalityPrompt(profile);

        assertThat(prompt).isNotBlank();
        assertThat(prompt).contains("direct");
        assertThat(prompt).doesNotContain("null");
    }
}
