package vn.kidslink.api.messaging;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.common.UserDto;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/messaging")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @PostMapping("/conversations")
    public ResponseEntity<MessagingDtos.ConversationDto> createConversation(
            @AuthenticationPrincipal CurrentUser user,
            @RequestBody MessagingDtos.CreateConversationRequest request) {
        return ResponseEntity.status(201).body(messagingService.createConversation(user, request));
    }

    @GetMapping("/conversations")
    public List<MessagingDtos.ConversationDto> conversations(@AuthenticationPrincipal CurrentUser user) {
        return messagingService.conversations(user);
    }

    @GetMapping("/conversations/{conversationId}")
    public MessagingDtos.ConversationDto conversation(@AuthenticationPrincipal CurrentUser user,
                                                      @PathVariable String conversationId) {
        return messagingService.conversation(user, conversationId);
    }

    @PostMapping("/conversations/{conversationId}/participants")
    public ResponseEntity<UserDto.Summary> addParticipant(
            @AuthenticationPrincipal CurrentUser user,
            @PathVariable String conversationId,
            @RequestBody MessagingDtos.AddParticipantRequest request) {
        return ResponseEntity.status(201)
                .body(messagingService.addParticipant(user, conversationId, request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessagingDtos.MessageDto> messages(@AuthenticationPrincipal CurrentUser user,
                                                  @PathVariable String conversationId,
                                                  @RequestParam(required = false) String before,
                                                  @RequestParam(required = false) Integer limit) {
        return messagingService.messages(user, conversationId, before, limit);
    }

    @PostMapping("/messages")
    public ResponseEntity<MessagingDtos.MessageDto> send(@AuthenticationPrincipal CurrentUser user,
                                                          @RequestBody MessagingDtos.SendMessageRequest request) {
        return ResponseEntity.status(201).body(messagingService.send(user, request));
    }

    @PutMapping("/conversations/{conversationId}/read")
    public Map<String, String> markRead(@AuthenticationPrincipal CurrentUser user,
                                        @PathVariable String conversationId) {
        return messagingService.markRead(user, conversationId);
    }

    @GetMapping("/unread-count")
    public MessagingDtos.UnreadCountDto unreadCount(@AuthenticationPrincipal CurrentUser user) {
        return messagingService.unreadCount(user);
    }

    @PostMapping("/conversations/direct")
    public MessagingDtos.ConversationDto direct(@AuthenticationPrincipal CurrentUser user,
                                                @RequestBody MessagingDtos.DirectConversationRequest request) {
        return messagingService.direct(user, request);
    }

    @GetMapping("/teachers-by-student/{studentId}")
    public MessagingDtos.ClassTeachersDto teachersByStudent(@AuthenticationPrincipal CurrentUser user,
                                                            @PathVariable String studentId) {
        return messagingService.teachersByStudent(studentId);
    }

    @GetMapping("/parents-by-teacher-class")
    public MessagingDtos.ClassParentsDto parentsByTeacherClass(@AuthenticationPrincipal CurrentUser user) {
        return messagingService.parentsByTeacherClass(user);
    }
}
