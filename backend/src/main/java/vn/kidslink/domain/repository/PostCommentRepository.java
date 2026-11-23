package vn.kidslink.domain.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.PostComment;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
}
