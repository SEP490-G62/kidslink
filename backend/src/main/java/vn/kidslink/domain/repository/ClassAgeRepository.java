package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassAge;

public interface ClassAgeRepository extends JpaRepository<ClassAge, UUID> {

    List<ClassAge> findBySchoolIdOrderByAgeAsc(UUID schoolId);
}
