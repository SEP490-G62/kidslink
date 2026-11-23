package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "conversations")
public class Conversation extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(name = "create_at", nullable = false)
    private Instant createAt;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private ClassEntity classEntity;

    @Column(name = "is_class_group", nullable = false)
    private Boolean isClassGroup = false;
}
