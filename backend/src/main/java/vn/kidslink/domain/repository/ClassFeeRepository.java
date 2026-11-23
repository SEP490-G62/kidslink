package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassFee;

public interface ClassFeeRepository extends JpaRepository<ClassFee, UUID> {

    List<ClassFee> findByFeeSchoolIdOrderByCreatedAtDesc(UUID schoolId);

    List<ClassFee> findByClassEntityId(UUID classId);
}
