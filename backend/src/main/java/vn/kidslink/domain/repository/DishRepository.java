package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Dish;

public interface DishRepository extends JpaRepository<Dish, UUID> {

    List<Dish> findBySchoolIdOrderByDishNameAsc(UUID schoolId);
}
