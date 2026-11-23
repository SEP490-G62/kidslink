package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "health_records")
public class HealthRecord extends BaseEntity {

    @Column(name = "checkup_date", nullable = false)
    private LocalDate checkupDate;

    @Column(name = "height_cm", nullable = false, precision = 5, scale = 1)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", nullable = false, precision = 5, scale = 1)
    private BigDecimal weightKg;

    @Column(nullable = false)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_care_staff_id", nullable = false)
    private HealthCareStaff healthCareStaff;
}
