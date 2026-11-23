package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "daily_reports")
public class DailyReport extends BaseEntity {

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "checkin_time", length = 10)
    private String checkinTime;

    @Column(name = "checkout_time", length = 10)
    private String checkoutTime;

    @Column
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_checkin_id")
    private Teacher teacherCheckin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_checkout_id")
    private Teacher teacherCheckout;
}
