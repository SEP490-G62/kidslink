package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "health_notices")
public class HealthNotice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String symptoms;

    @Column(name = "actions_taken", nullable = false)
    private String actionsTaken;

    @Column(nullable = false)
    private String medications;

    @Column(name = "notice_time", nullable = false, length = 10)
    private String noticeTime;

    @Column(nullable = false)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_care_staff_id", nullable = false)
    private HealthCareStaff healthCareStaff;
}
