package vn.kidslink.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.DailyReport;

public interface DailyReportRepository extends JpaRepository<DailyReport, UUID> {

    Optional<DailyReport> findByStudent_IdAndReportDate(UUID studentId, LocalDate reportDate);

    List<DailyReport> findByStudent_IdAndReportDateBetweenOrderByReportDateAsc(UUID studentId, LocalDate from, LocalDate to);

    List<DailyReport> findByStudent_IdOrderByReportDateDesc(UUID studentId);

    List<DailyReport> findByStudent_IdInAndReportDate(java.util.Collection<UUID> studentIds, LocalDate reportDate);


    default Optional<DailyReport> findByStudentIdAndReportDate(UUID studentId, LocalDate reportDate) {
        return findByStudent_IdAndReportDate(studentId, reportDate);
    }

    default List<DailyReport> findByStudentIdAndReportDateBetweenOrderByReportDateAsc(UUID studentId, LocalDate from, LocalDate to) {
        return findByStudent_IdAndReportDateBetweenOrderByReportDateAsc(studentId, from, to);
    }

    default List<DailyReport> findByStudentIdOrderByReportDateDesc(UUID studentId) {
        return findByStudent_IdOrderByReportDateDesc(studentId);
    }

    default java.util.List<DailyReport> findByStudentIdInAndReportDate(java.util.List<UUID> studentIds, LocalDate reportDate) {
        return findByStudent_IdInAndReportDate(studentIds, reportDate);
    }

}
