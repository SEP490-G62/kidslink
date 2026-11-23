package vn.kidslink.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.DailyReport;

public interface DailyReportRepository extends JpaRepository<DailyReport, UUID> {

    Optional<DailyReport> findByStudentIdAndReportDate(UUID studentId, LocalDate reportDate);

    List<DailyReport> findByStudentIdAndReportDateBetweenOrderByReportDateAsc(UUID studentId, LocalDate from, LocalDate to);

    List<DailyReport> findByStudentIdOrderByReportDateDesc(UUID studentId);
}
