package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ParentStudent;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, UUID> {

    List<ParentStudent> findByParentId(UUID parentId);

    List<ParentStudent> findByStudentId(UUID studentId);

    Optional<ParentStudent> findByParentIdAndStudentId(UUID parentId, UUID studentId);
}
