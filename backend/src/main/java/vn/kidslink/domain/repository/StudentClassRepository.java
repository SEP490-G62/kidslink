package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.StudentClass;

public interface StudentClassRepository extends JpaRepository<StudentClass, UUID> {

    List<StudentClass> findByClassEntity_Id(UUID classId);

    List<StudentClass> findByStudent_Id(UUID studentId);

    Optional<StudentClass> findByStudent_IdAndClassEntityId(UUID studentId, UUID classId);

    boolean existsByStudent_IdAndClassEntityId(UUID studentId, UUID classId);

    Optional<StudentClass> findByIdAndClassEntityId(UUID id, UUID classId);

    // Legacy aliases used by the API layer.
    default List<StudentClass> findByClassEntityId(UUID classId) {
        return findByClassEntity_Id(classId);
    }

    default List<StudentClass> findByStudentId(UUID studentId) {
        return findByStudent_Id(studentId);
    }

    default Optional<StudentClass> findByStudentIdAndClassEntityId(UUID studentId, UUID classId) {
        return findByStudent_IdAndClassEntityId(studentId, classId);
    }

    default boolean existsByStudentIdAndClassEntityId(UUID studentId, UUID classId) {
        return existsByStudent_IdAndClassEntityId(studentId, classId);
    }

}
