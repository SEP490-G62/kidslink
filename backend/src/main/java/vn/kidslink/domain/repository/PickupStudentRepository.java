package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.PickupStudent;

public interface PickupStudentRepository extends JpaRepository<PickupStudent, UUID> {

    List<PickupStudent> findByStudent_Id(UUID studentId);

    List<PickupStudent> findByPickup_Id(UUID pickupId);

    default List<PickupStudent> findByPickupId(UUID pickupId) {
        return findByPickup_Id(pickupId);
    }

    Optional<PickupStudent> findByPickup_IdAndStudent_Id(UUID pickupId, UUID studentId);

    default List<PickupStudent> findByStudentId(UUID studentId) {
        return findByStudent_Id(studentId);
    }

    default Optional<PickupStudent> findByPickupIdAndStudentId(UUID pickupId, UUID studentId) {
        return findByPickup_IdAndStudent_Id(pickupId, studentId);
    }
}
