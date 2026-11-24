package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.DishMeal;

public interface DishMealRepository extends JpaRepository<DishMeal, DishMeal.DishMealId> {

    List<DishMeal> findByDishId(UUID dishId);

    List<DishMeal> findByDishIdIn(java.util.Collection<UUID> dishIds);

    void deleteByDishId(UUID dishId);
}
