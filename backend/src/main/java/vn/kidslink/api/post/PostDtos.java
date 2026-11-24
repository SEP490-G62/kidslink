package vn.kidslink.api.post;

import java.time.Instant;
import java.util.List;
import vn.kidslink.common.UserDto;

/** DTO shapes for posts, likes and comments (JSON keys snake_case via global Jackson config). */
public final class PostDtos {

    private PostDtos() {
    }

    /** Legacy post shape: flat class info + aggregated counts. */
    public record PostDto(
            String id,
            String content,
            String status,
            Instant createAt,
            UserDto.Summary user,
            String classId,
            String className,
            String classAgeId,
            String academicYear,
            List<String> images,
            long likeCount,
            long commentCount,
            boolean isLiked) {
    }

    public record CreatePostRequest(String content, List<String> images, String classId, String studentId) {
    }

    public record UpdatePostRequest(String content, List<String> images) {
    }

    public record StatusRequest(String status) {
    }

    public record LikeResultDto(boolean isLiked, long likeCount) {
    }

    /** Comment with nested replies (tree shape, legacy field `contents` kept). */
    public record CommentDto(
            String id,
            String contents,
            Instant createAt,
            String postId,
            UserDto.Summary user,
            String parentCommentId,
            List<CommentDto> replies) {
    }

    public record CreateCommentRequest(String contents, String parentCommentId) {
    }

    public record UpdateCommentRequest(String contents) {
    }
}
