package vn.kidslink.domain.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ParentStudent;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, UUID> {
}
