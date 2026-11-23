package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    List<User> findBySchoolIdAndRole(UUID schoolId, Role role);

    List<User> findBySchoolId(UUID schoolId);

    @Query("""
            select u from User u
            where (:schoolId is null or u.school.id = :schoolId)
              and (:role is null or u.role = :role)
              and (:status is null or u.status = :status)
              and (:q is null or lower(u.fullName) like lower(concat('%', :q, '%'))
                   or lower(coalesce(u.username, '')) like lower(concat('%', :q, '%'))
                   or lower(coalesce(u.email, '')) like lower(concat('%', :q, '%')))
            """)
    Page<User> search(@Param("schoolId") UUID schoolId,
                      @Param("role") Role role,
                      @Param("status") Short status,
                      @Param("q") String q,
                      Pageable pageable);
}
