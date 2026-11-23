package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Post;

public interface PostRepository extends JpaRepository<Post, UUID> {

    List<Post> findByStatusOrderByCreatedAtDesc(String status);

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
