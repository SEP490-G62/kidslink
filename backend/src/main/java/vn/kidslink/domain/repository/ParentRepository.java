package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.kidslink.domain.entity.Parent;

public interface ParentRepository extends JpaRepository<Parent, UUID> {

    @Query("select p from Parent p where p.user.school.id = :schoolId")
    List<Parent> findByUserSchoolId(UUID schoolId);

    Optional<Parent> findByUserId(UUID userId);
}
