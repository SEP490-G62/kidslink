package vn.kidslink.domain.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Parent;

public interface ParentRepository extends JpaRepository<Parent, UUID> {

    Optional<Parent> findByUserId(UUID userId);
}
