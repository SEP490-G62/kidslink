package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Complaint;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);

    List<Complaint> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countBySchoolIdAndStatus(UUID schoolId, String status);
}
