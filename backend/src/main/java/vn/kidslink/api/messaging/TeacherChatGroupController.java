package vn.kidslink.api.messaging;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/teachers")
public class TeacherChatGroupController {

    private final MessagingService messagingService;

    public TeacherChatGroupController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    /** Create (or join) the class group chat. */
    @PostMapping("/class/chat-group")
    public ResponseEntity<MessagingDtos.ConversationDto> createChatGroup(
            @AuthenticationPrincipal CurrentUser user,
            @RequestBody(required = false) MessagingDtos.CreateChatGroupRequest request) {
        return ResponseEntity.status(201)
                .body(messagingService.createClassChatGroup(user,
                        request == null ? new MessagingDtos.CreateChatGroupRequest(null, null) : request));
    }
}
