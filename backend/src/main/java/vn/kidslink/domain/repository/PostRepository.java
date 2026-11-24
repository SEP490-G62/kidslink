package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.kidslink.domain.entity.Post;

public interface PostRepository extends JpaRepository<Post, UUID> {

    List<Post> findByStatusOrderByCreatedAtDesc(String status);

    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** All posts (any status) touching a school, via author or class. */
    @Query("""
            select p from Post p
            where p.user.school.id = :schoolId
               or p.classEntity.school.id = :schoolId
            order by p.createdAt desc
            """)
    List<Post> findBySchool(@Param("schoolId") UUID schoolId);
}
