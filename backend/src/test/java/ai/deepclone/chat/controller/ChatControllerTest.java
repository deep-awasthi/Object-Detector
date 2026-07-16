package ai.deepclone.chat.controller;

import ai.deepclone.chat.service.ChatService;
import ai.deepclone.conversation.entity.Conversation;
import ai.deepclone.security.JwtAuthenticationFilter;
import ai.deepclone.security.RateLimitFilter;
import ai.deepclone.security.JwtService;
import ai.deepclone.users.entity.User;
import ai.deepclone.users.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link ChatController}.
 */
@WebMvcTest(
        controllers = ChatController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class, RateLimitFilter.class}
        )
)
@DisplayName("ChatController Tests")
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    private User testUser;
    private Conversation testConversation;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hash")
                .role(User.Role.OWNER)
                .build();

        testConversation = Conversation.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Test Conversation")
                .model("qwen2.5:latest")
                .build();
    }

    @Test
    @DisplayName("POST /v1/chat/conversations — should create and return conversation")
    @WithMockUser
    void shouldCreateConversation() throws Exception {
        when(chatService.createConversation(any(), eq("Test Chat"), eq("qwen2.5:latest")))
                .thenReturn(testConversation);

        mockMvc.perform(post("/v1/chat/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ChatController.CreateConversationRequest("Test Chat", "qwen2.5:latest")
                        ))
                        .with(user(testUser)).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test Conversation"));
    }

    @Test
    @DisplayName("GET /v1/chat/conversations — should list conversations")
    @WithMockUser
    void shouldListConversations() throws Exception {
        var page = new PageImpl<>(List.of(testConversation), PageRequest.of(0, 20), 1);
        when(chatService.listConversations(any(UUID.class), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/v1/chat/conversations").with(user(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Conversation"));
    }

    @Test
    @DisplayName("DELETE /v1/chat/conversations/{id} — should delete conversation")
    @WithMockUser
    void shouldDeleteConversation() throws Exception {
        UUID convId = testConversation.getId();

        mockMvc.perform(delete("/v1/chat/conversations/{id}", convId)
                        .with(user(testUser)).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /v1/chat/conversations — should require authentication")
    void shouldRequireAuthentication() throws Exception {
        mockMvc.perform(post("/v1/chat/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}
