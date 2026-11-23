package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Pickup;

public interface PickupRepository extends JpaRepository<Pickup, UUID> {

    Optional<Pickup> findByIdCardNumber(String idCardNumber);

    List<Pickup> findByPhone(String phone);
}
