package vn.kidslink.domain.entity;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Join table Dish <-> Meal (legacy Dish.category: Meal[]). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dish_meals")
@IdClass(DishMeal.DishMealId.class)
public class DishMeal {

    @jakarta.persistence.Id
    private UUID dishId;

    @jakarta.persistence.Id
    private UUID mealId;

    @Getter
    @Setter
    @NoArgsConstructor
    @Embeddable
    public static class DishMealId implements Serializable {
        private UUID dishId;
        private UUID mealId;

        public DishMealId(UUID dishId, UUID mealId) {
            this.dishId = dishId;
            this.mealId = mealId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DishMealId that)) return false;
            return Objects.equals(dishId, that.dishId) && Objects.equals(mealId, that.mealId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(dishId, mealId);
        }
    }
}
