package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "fees")
public class Fee extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "fee_name", nullable = false)
    private String feeName;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "late_fee_type", nullable = false, length = 20)
    private String lateFeeType = "none";

    @Column(name = "late_fee_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal lateFeeValue = BigDecimal.ZERO;

    @Column(name = "late_fee_description")
    private String lateFeeDescription = "";
}
