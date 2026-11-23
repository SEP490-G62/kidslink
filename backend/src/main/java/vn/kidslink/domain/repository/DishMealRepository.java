package vn.kidslink.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.DishMeal;

public interface DishMealRepository extends JpaRepository<DishMeal, DishMeal.DishMealId> {
}
