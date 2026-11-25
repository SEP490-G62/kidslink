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

    @Query(value = """
            select * from users u
            where (:schoolId is null or u.school_id = cast(:schoolId as uuid))
              and (:role is null or u.role = :role)
              and (:status is null or u.status = cast(:status as smallint))
              and (:q is null
                   or lower(u.full_name) like concat('%', lower(:q), '%')
                   or lower(coalesce(u.username, '')) like concat('%', lower(:q), '%')
                   or lower(coalesce(u.email, '')) like concat('%', lower(:q), '%'))
            order by u.created_at desc
            """,
            countQuery = """
            select count(*) from users u
            where (:schoolId is null or u.school_id = cast(:schoolId as uuid))
              and (:role is null or u.role = :role)
              and (:status is null or u.status = cast(:status as smallint))
              and (:q is null
                   or lower(u.full_name) like concat('%', lower(:q), '%')
                   or lower(coalesce(u.username, '')) like concat('%', lower(:q), '%')
                   or lower(coalesce(u.email, '')) like concat('%', lower(:q), '%'))
            """,
            nativeQuery = true)
    Page<User> search(@Param("schoolId") UUID schoolId,
                      @Param("role") String role,
                      @Param("status") Short status,
                      @Param("q") String q,
                      Pageable pageable);
}
