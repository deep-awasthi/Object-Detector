package ai.deepclone.personality.controller;

import ai.deepclone.personality.entity.PersonalityProfile;
import ai.deepclone.personality.service.PersonalityService;
import ai.deepclone.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Personality profile REST API.
 */
@Tag(name = "Personality", description = "Manage the AI clone's personality profile")
@RestController
@RequestMapping("/v1/personality")
@RequiredArgsConstructor
public class PersonalityController {

    private final PersonalityService personalityService;

    @Operation(summary = "Get personality profile")
    @GetMapping
    public ResponseEntity<PersonalityProfile> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(personalityService.getOrCreateProfile(user));
    }

    @Operation(summary = "Update personality profile")
    @PutMapping
    public ResponseEntity<PersonalityProfile> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody PersonalityProfile profileUpdate
    ) {
        PersonalityProfile existing = personalityService.getOrCreateProfile(user);

        // Apply updates — only non-null fields
        if (profileUpdate.getDisplayName() != null) existing.setDisplayName(profileUpdate.getDisplayName());
        if (profileUpdate.getShortBio() != null) existing.setShortBio(profileUpdate.getShortBio());
        if (profileUpdate.getTone() != null) existing.setTone(profileUpdate.getTone());
        if (profileUpdate.getHumor() != null) existing.setHumor(profileUpdate.getHumor());
        if (profileUpdate.getSentenceLength() != null) existing.setSentenceLength(profileUpdate.getSentenceLength());
        if (profileUpdate.getEmojiUsage() != null) existing.setEmojiUsage(profileUpdate.getEmojiUsage());
        if (profileUpdate.getTechnicalLevel() != null) existing.setTechnicalLevel(profileUpdate.getTechnicalLevel());
        if (profileUpdate.getGreetingStyle() != null) existing.setGreetingStyle(profileUpdate.getGreetingStyle());
        if (profileUpdate.getClosingStyle() != null) existing.setClosingStyle(profileUpdate.getClosingStyle());
        if (profileUpdate.getVocabulary() != null) existing.setVocabulary(profileUpdate.getVocabulary());
        if (profileUpdate.getFrequentlyUsedPhrases() != null) existing.setFrequentlyUsedPhrases(profileUpdate.getFrequentlyUsedPhrases());
        if (profileUpdate.getWordsToAvoid() != null) existing.setWordsToAvoid(profileUpdate.getWordsToAvoid());
        if (profileUpdate.getWritingStructure() != null) existing.setWritingStructure(profileUpdate.getWritingStructure());
        if (profileUpdate.getReasoningStyle() != null) existing.setReasoningStyle(profileUpdate.getReasoningStyle());
        if (profileUpdate.getCodingPhilosophy() != null) existing.setCodingPhilosophy(profileUpdate.getCodingPhilosophy());
        if (profileUpdate.getCustomInstructions() != null) existing.setCustomInstructions(profileUpdate.getCustomInstructions());

        return ResponseEntity.ok(personalityService.save(existing));
    }
}
