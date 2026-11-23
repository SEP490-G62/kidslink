package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.kidslink.domain.Role;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, length = 100)
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    @Convert(converter = Role.Converter.class)
    @Column(nullable = false, length = 32)
    private Role role;

    @Column(name = "avatar_url", nullable = false)
    private String avatarUrl = "";

    @Column(nullable = false)
    private Short status = 1;

    @Column(unique = true)
    private String email;

    @Column(name = "phone_number", unique = true, length = 30)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @Column
    private String address;
}
