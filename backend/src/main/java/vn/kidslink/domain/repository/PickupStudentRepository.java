package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.PickupStudent;

public interface PickupStudentRepository extends JpaRepository<PickupStudent, UUID> {

    List<PickupStudent> findByStudentId(UUID studentId);

    List<PickupStudent> findByPickupId(UUID pickupId);

    Optional<PickupStudent> findByPickupIdAndStudentId(UUID pickupId, UUID studentId);
}
