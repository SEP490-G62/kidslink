package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassFee;

public interface ClassFeeRepository extends JpaRepository<ClassFee, UUID> {

    List<ClassFee> findByFeeSchoolIdOrderByCreatedAtDesc(UUID schoolId);

    List<ClassFee> findByFeeIdAndStatus(UUID feeId, Short status);

    List<ClassFee> findByFeeId(UUID feeId);

    long countByFeeIdAndStatus(UUID feeId, Short status);

    List<ClassFee> findByClassEntity_IdAndStatus(UUID classId, Short status);

    Optional<ClassFee> findByIdAndFeeIdAndStatus(UUID id, UUID feeId, Short status);

    default List<ClassFee> findByClassEntityIdAndStatus(UUID classId, Short status) {
        return findByClassEntity_IdAndStatus(classId, status);
    }

}
