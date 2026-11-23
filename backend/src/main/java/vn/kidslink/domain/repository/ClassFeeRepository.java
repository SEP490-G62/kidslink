package vn.kidslink.domain.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ClassFee;

public interface ClassFeeRepository extends JpaRepository<ClassFee, UUID> {
}
