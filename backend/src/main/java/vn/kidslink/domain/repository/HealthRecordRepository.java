package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.HealthRecord;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, UUID> {

    List<HealthRecord> findByStudentIdOrderByCheckupDateDesc(UUID studentId);

    List<HealthRecord> findByStudentStudentIdInOrderByCheckupDateDesc(List<UUID> studentIds);
}
