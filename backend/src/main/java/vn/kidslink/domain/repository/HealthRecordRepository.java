package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.HealthRecord;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, UUID> {

    List<HealthRecord> findByStudent_IdOrderByCheckupDateDesc(UUID studentId);

    List<HealthRecord> findByStudent_IdInOrderByCheckupDateDesc(List<UUID> studentIds);

    default List<HealthRecord> findByStudentIdOrderByCheckupDateDesc(UUID studentId) {
        return findByStudent_IdOrderByCheckupDateDesc(studentId);
    }
}
