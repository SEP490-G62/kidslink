package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.WeekDay;

public interface WeekDayRepository extends JpaRepository<WeekDay, UUID> {

    List<WeekDay> findAllByOrderByDayOfWeekAsc();

    java.util.Optional<WeekDay> findByDayOfWeek(String dayOfWeek);
}
