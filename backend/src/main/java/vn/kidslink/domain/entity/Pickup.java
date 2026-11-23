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
@Table(name = "pickups")
public class Pickup extends BaseEntity {

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, length = 50)
    private String relationship;

    @Column(name = "id_card_number", nullable = false, unique = true, length = 30)
    private String idCardNumber;

    @Column(name = "avatar_url", nullable = false)
    private String avatarUrl = "";

    @Column(nullable = false, unique = true, length = 30)
    private String phone;
}
