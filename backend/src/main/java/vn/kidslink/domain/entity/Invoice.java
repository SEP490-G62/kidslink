package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "invoices")
public class Invoice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_fee_id", nullable = false)
    private ClassFee classFee;

    @Column(name = "amount_due", nullable = false, precision = 14, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_class_id", nullable = false)
    private StudentClass studentClass;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false)
    private Short status = 0;

    @Column(name = "payos_order_code")
    private Long payosOrderCode;

    @Column(name = "payos_checkout_url")
    private String payosCheckoutUrl;

    @Column(name = "payos_qr_code")
    private String payosQrCode;

    @Column(name = "payos_qr_url")
    private String payosQrUrl;

    @Column(name = "payos_expired_at")
    private Instant payosExpiredAt;

    @Column(name = "payos_transaction_id")
    private String payosTransactionId;

    @Column(name = "late_fee_amount", precision = 14, scale = 2)
    private BigDecimal lateFeeAmount;

    @Column(name = "late_fee_applied_at")
    private Instant lateFeeAppliedAt;
}
