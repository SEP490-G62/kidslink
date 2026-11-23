package vn.kidslink.domain.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.School;

public interface SchoolRepository extends JpaRepository<School, UUID> {

    Optional<School> findFirstByEmail(String email);

    Optional<School> findFirstByPhone(String phone);
}
