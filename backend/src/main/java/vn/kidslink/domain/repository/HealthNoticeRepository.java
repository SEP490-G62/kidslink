package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.HealthNotice;

public interface HealthNoticeRepository extends JpaRepository<HealthNotice, UUID> {

    List<HealthNotice> findByStudent_IdOrderByCreatedAtDesc(UUID studentId);

    List<HealthNotice> findByStudent_School_IdOrderByCreatedAtDesc(UUID schoolId);

    List<HealthNotice> findByStudent_IdInOrderByCreatedAtDesc(List<UUID> studentIds);

    default List<HealthNotice> findByStudentIdOrderByCreatedAtDesc(UUID studentId) {
        return findByStudent_IdOrderByCreatedAtDesc(studentId);
    }
}
