package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.kidslink.domain.entity.Teacher;

public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    Optional<Teacher> findByUserId(UUID userId);

    @Query("select t from Teacher t join t.user u where u.school.id = :schoolId")
    List<Teacher> findBySchoolId(@Param("schoolId") UUID schoolId);
}
