package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.StudentClass;

public interface StudentClassRepository extends JpaRepository<StudentClass, UUID> {

    List<StudentClass> findByClassEntityId(UUID classId);

    List<StudentClass> findByStudentId(UUID studentId);

    Optional<StudentClass> findByStudentIdAndClassEntityId(UUID studentId, UUID classId);

    boolean existsByStudentIdAndClassEntityId(UUID studentId, UUID classId);
}
