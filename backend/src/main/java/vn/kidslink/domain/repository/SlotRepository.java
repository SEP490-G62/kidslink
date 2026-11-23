package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Slot;

public interface SlotRepository extends JpaRepository<Slot, UUID> {

    List<Slot> findBySchoolIdOrderByStartTimeAsc(UUID schoolId);
}
