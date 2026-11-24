package vn.kidslink.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassAgeMeal;

public interface ClassAgeMealRepository extends JpaRepository<ClassAgeMeal, UUID> {

    List<ClassAgeMeal> findByClassAgeSchoolIdOrderByDateAsc(UUID schoolId);

    Optional<ClassAgeMeal> findByClassAgeIdAndMealIdAndWeekdayIdAndDate(UUID classAgeId, UUID mealId, UUID weekdayId, LocalDate date);

    List<ClassAgeMeal> findByClassAgeIdAndDateBetween(UUID classAgeId, LocalDate from, LocalDate to);

    List<ClassAgeMeal> findByClassAgeIdOrderByDateDesc(UUID classAgeId);
}
