package vn.kidslink.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Calendar;

public interface CalendarRepository extends JpaRepository<Calendar, UUID> {

    List<Calendar> findByClassEntityIdOrderByDateAscSlotStartTimeAsc(UUID classId);

    List<Calendar> findByClassEntityIdAndDateBetweenOrderByDateAscSlotStartTimeAsc(UUID classId, LocalDate from, LocalDate to);

    List<Calendar> findByTeacherIdAndDateBetweenOrderByDateAscSlotStartTimeAsc(UUID teacherId, LocalDate from, LocalDate to);

    List<Calendar> findByClassEntityIdAndDateAndSlotId(UUID classId, LocalDate date, UUID slotId);
}
