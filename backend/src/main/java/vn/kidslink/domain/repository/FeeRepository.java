package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Fee;

public interface FeeRepository extends JpaRepository<Fee, UUID> {

    List<Fee> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
