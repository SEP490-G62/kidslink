package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Student;

public interface StudentRepository extends JpaRepository<Student, UUID> {

    List<Student> findBySchoolIdOrderByFullNameAsc(UUID schoolId);
}
