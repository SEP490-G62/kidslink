package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.HealthNotice;

public interface HealthNoticeRepository extends JpaRepository<HealthNotice, UUID> {

    List<HealthNotice> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    List<HealthNotice> findByStudentSchoolIdOrderByCreatedAtDesc(UUID schoolId);

    List<HealthNotice> findByStudentStudentIdInOrderByCreatedAtDesc(List<UUID> studentIds);
}
