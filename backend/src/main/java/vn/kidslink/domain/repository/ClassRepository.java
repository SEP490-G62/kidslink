package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassEntity;

public interface ClassRepository extends JpaRepository<ClassEntity, UUID> {

    List<ClassEntity> findBySchoolIdOrderByClassNameAsc(UUID schoolId);

    List<ClassEntity> findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(UUID teacherId, UUID coTeacherId);
}
