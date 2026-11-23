package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.PostLike;

public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    Optional<PostLike> findByPostIdAndUserId(UUID postId, UUID userId);

    long countByPostId(UUID postId);

    List<PostLike> findByPostId(UUID postId);

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
}
