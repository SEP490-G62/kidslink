package vn.kidslink.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Calendar;

public interface CalendarRepository extends JpaRepository<Calendar, UUID> {

    List<Calendar> findByClassEntity_IdOrderByDateAscSlotStartTimeAsc(UUID classId);

    List<Calendar> findByClassEntity_IdAndDateBetweenOrderByDateAscSlotStartTimeAsc(UUID classId, LocalDate from, LocalDate to);

    List<Calendar> findByTeacherIdAndDateBetweenOrderByDateAscSlotStartTimeAsc(UUID teacherId, LocalDate from, LocalDate to);

    List<Calendar> findByClassEntity_IdAndDateAndSlotId(UUID classId, LocalDate date, UUID slotId);

    boolean existsByClassEntityIdAndDate(UUID classId, LocalDate date);

    List<Calendar> findByTeacherIdOrderByDateAscSlotStartTimeAsc(UUID teacherId);

    List<Calendar> findByTeacherIdAndDate(UUID teacherId, LocalDate date);

    List<Calendar> findByClassEntity_IdAndDate(UUID classId, LocalDate date);

    long countBySlotId(UUID slotId);

    long countByActivityId(UUID activityId);

    default List<Calendar> findByClassEntityIdOrderByDateAscSlotStartTimeAsc(UUID classId) {
        return findByClassEntity_IdOrderByDateAscSlotStartTimeAsc(classId);
    }

    default List<Calendar> findByClassEntityIdAndDateBetweenOrderByDateAscSlotStartTimeAsc(UUID classId, LocalDate from, LocalDate to) {
        return findByClassEntity_IdAndDateBetweenOrderByDateAscSlotStartTimeAsc(classId, from, to);
    }

    default List<Calendar> findByClassEntityIdAndDateAndSlotId(UUID classId, LocalDate date, UUID slotId) {
        return findByClassEntity_IdAndDateAndSlotId(classId, date, slotId);
    }

    default List<Calendar> findByClassEntityIdAndDate(UUID classId, LocalDate date) {
        return findByClassEntity_IdAndDate(classId, date);
    }

}
