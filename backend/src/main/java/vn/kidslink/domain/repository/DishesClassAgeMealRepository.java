package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.DishesClassAgeMeal;

public interface DishesClassAgeMealRepository extends JpaRepository<DishesClassAgeMeal, UUID> {

    List<DishesClassAgeMeal> findByClassAgeMealId(UUID classAgeMealId);

    void deleteByClassAgeMealId(UUID classAgeMealId);
}
