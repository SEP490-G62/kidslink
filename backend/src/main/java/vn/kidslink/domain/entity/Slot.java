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
@Table(name = "slots")
public class Slot extends BaseEntity {

    @Column(name = "slot_name", nullable = false, length = 100)
    private String slotName;

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}
