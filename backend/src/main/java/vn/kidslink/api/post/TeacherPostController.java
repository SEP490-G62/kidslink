package vn.kidslink.api.post;

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
public class TeacherPostController extends BasePostController {

    private final PostService postService;

    public TeacherPostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDtos.PostDto> createPost(@AuthenticationPrincipal CurrentUser user,
                                                       @RequestBody PostDtos.CreatePostRequest request) {
        return ResponseEntity.status(201).body(postService.createTeacherPost(user, request));
    }

    @Override
    protected PostService postService() {
        return postService;
    }
}
