package vn.kidslink.api.messaging;

import java.security.Principal;
import java.util.UUID;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * STOMP handlers for the chat: client sends to /app/message.send|message.read|typing,
 * events are broadcast on /topic/conversations/{id}. Principal name is the user id
 * set by {@link vn.kidslink.ws.JwtChannelInterceptor}.
 */
@Controller
public class MessagingStompController {

    private final MessagingService messagingService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessagingStompController(MessagingService messagingService,
                                    SimpMessagingTemplate messagingTemplate) {
        this.messagingService = messagingService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/message.send")
    public void send(MessagingDtos.SendMessageRequest request, Principal principal) {
        UUID userId = userId(principal);
        if (userId == null) {
            return;
        }
        MessagingDtos.MessageDto message = messagingService.send(userId, request);
        messagingTemplate.convertAndSend("/topic/conversations/" + message.conversationId(), message);
    }

    @MessageMapping("/message.read")
    public void read(ReadPayload payload, Principal principal) {
        UUID userId = userId(principal);
        if (userId == null || payload.conversationId() == null || payload.conversationId().isBlank()) {
            return;
        }
        messagingService.markRead(userId, payload.conversationId());
        messagingTemplate.convertAndSend("/topic/conversations/" + payload.conversationId(),
                new ReadEvent("read", payload.conversationId(), userId.toString()));
    }

    @MessageMapping("/typing")
    public void typing(TypingPayload payload, Principal principal) {
        UUID userId = userId(principal);
        if (userId == null || payload.conversationId() == null || payload.conversationId().isBlank()) {
            return;
        }
        messagingTemplate.convertAndSend("/topic/conversations/" + payload.conversationId(),
                new TypingEvent("typing", payload.conversationId(), userId.toString(),
                        payload.isTyping() == null || payload.isTyping()));
    }

    public record ReadPayload(String conversationId) {
    }

    public record TypingPayload(String conversationId, Boolean isTyping) {
    }

    /** Broadcast shapes for /topic/conversations/{id} (snake_case keys via Jackson). */
    public record ReadEvent(String type, String conversationId, String userId) {
    }

    public record TypingEvent(String type, String conversationId, String userId, boolean isTyping) {
    }

    private UUID userId(Principal principal) {
        if (principal == null) {
            return null;
        }
        try {
            return UUID.fromString(principal.getName());
        } catch (IllegalArgumentException e) {
            return null; // synthetic "admin" subject has no messaging record
        }
    }
}
