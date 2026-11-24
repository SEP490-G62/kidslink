package vn.kidslink.api.post;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/school-admin")
public class SchoolAdminPostController extends BasePostController {

    private final PostService postService;

    public SchoolAdminPostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDtos.PostDto> createPost(@AuthenticationPrincipal CurrentUser user,
                                                       @RequestBody PostDtos.CreatePostRequest request) {
        return ResponseEntity.status(201).body(postService.createSchoolAdminPost(user, request));
    }

    /** Approve a post or reset it to pending. */
    @PutMapping("/posts/{postId}/status")
    public PostDtos.PostDto updateStatus(@AuthenticationPrincipal CurrentUser user,
                                         @PathVariable String postId,
                                         @RequestBody PostDtos.StatusRequest request) {
        return postService.setStatus(user, postId, request.status());
    }

    @Override
    protected PostService postService() {
        return postService;
    }
}
