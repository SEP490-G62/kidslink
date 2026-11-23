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
@Table(name = "activities")
public class Activity extends BaseEntity {

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(nullable = false)
    private String description;

    @Column(name = "require_outdoor")
    private Short requireOutdoor = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}
