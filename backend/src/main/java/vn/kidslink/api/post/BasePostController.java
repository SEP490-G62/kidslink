package vn.kidslink.api.post;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import vn.kidslink.common.UserDto;
import vn.kidslink.security.CurrentUser;

/**
 * Post/comment/like endpoints shared by the parent, teacher and school-admin prefixes.
 * Concrete controllers add their role-specific {@code POST /posts} handling.
 */
public abstract class BasePostController {

    protected abstract PostService postService();

    @GetMapping("/posts")
    public List<PostDtos.PostDto> feed(@AuthenticationPrincipal CurrentUser user) {
        return postService().feed(user);
    }

    @GetMapping("/posts/my-posts")
    public List<PostDtos.PostDto> myPosts(@AuthenticationPrincipal CurrentUser user) {
        return postService().myPosts(user);
    }

    @PutMapping("/posts/{postId}")
    public PostDtos.PostDto updatePost(@AuthenticationPrincipal CurrentUser user,
                                        @PathVariable String postId,
                                        @RequestBody PostDtos.UpdatePostRequest request) {
        return postService().update(user, postId, request);
    }

    @DeleteMapping("/posts/{postId}")
    public Map<String, String> deletePost(@AuthenticationPrincipal CurrentUser user,
                                          @PathVariable String postId) {
        postService().delete(user, postId);
        return Map.of("message", "Xóa bài viết thành công");
    }

    @PostMapping("/posts/{postId}/like")
    public PostDtos.LikeResultDto toggleLike(@AuthenticationPrincipal CurrentUser user,
                                             @PathVariable String postId) {
        return postService().toggleLike(user, postId);
    }

    @GetMapping("/posts/{postId}/likes")
    public List<UserDto.Summary> likes(@AuthenticationPrincipal CurrentUser user,
                                       @PathVariable String postId) {
        return postService().likes(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<PostDtos.CommentDto> addComment(@AuthenticationPrincipal CurrentUser user,
                                                          @PathVariable String postId,
                                                          @RequestBody PostDtos.CreateCommentRequest request) {
        return ResponseEntity.status(201).body(postService().addComment(user, postId, request));
    }

    @GetMapping("/posts/{postId}/comments")
    public List<PostDtos.CommentDto> comments(@AuthenticationPrincipal CurrentUser user,
                                              @PathVariable String postId) {
        return postService().comments(postId);
    }

    @PutMapping("/comments/{commentId}")
    public PostDtos.CommentDto updateComment(@AuthenticationPrincipal CurrentUser user,
                                             @PathVariable String commentId,
                                             @RequestBody PostDtos.UpdateCommentRequest request) {
        return postService().updateComment(user, commentId, request);
    }

    @DeleteMapping("/comments/{commentId}")
    public Map<String, String> deleteComment(@AuthenticationPrincipal CurrentUser user,
                                             @PathVariable String commentId) {
        postService().deleteComment(user, commentId);
        return Map.of("message", "Xóa comment thành công, các trả lời đã được đẩy lên");
    }
}
