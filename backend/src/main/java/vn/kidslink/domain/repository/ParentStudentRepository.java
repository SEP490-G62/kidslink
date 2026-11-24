package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ParentStudent;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, UUID> {

    List<ParentStudent> findByParent_Id(UUID parentId);

    List<ParentStudent> findByStudent_Id(UUID studentId);

    Optional<ParentStudent> findByParent_IdAndStudent_Id(UUID parentId, UUID studentId);

    default List<ParentStudent> findByParentId(UUID parentId) {
        return findByParent_Id(parentId);
    }

    default List<ParentStudent> findByStudentId(UUID studentId) {
        return findByStudent_Id(studentId);
    }

    default Optional<ParentStudent> findByParentIdAndStudentId(UUID parentId, UUID studentId) {
        return findByParent_IdAndStudent_Id(parentId, studentId);
    }

}
