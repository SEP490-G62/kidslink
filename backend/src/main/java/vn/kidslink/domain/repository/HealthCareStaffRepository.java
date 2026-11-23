package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.HealthCareStaff;

public interface HealthCareStaffRepository extends JpaRepository<HealthCareStaff, UUID> {

    Optional<HealthCareStaff> findByUserId(UUID userId);

    List<HealthCareStaff> findByUserSchoolId(UUID schoolId);
}
