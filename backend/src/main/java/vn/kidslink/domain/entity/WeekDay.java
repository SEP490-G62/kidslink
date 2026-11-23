package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "week_days")
public class WeekDay extends BaseEntity {

    @Column(name = "day_of_week", nullable = false, length = 20)
    private String dayOfWeek;
}
