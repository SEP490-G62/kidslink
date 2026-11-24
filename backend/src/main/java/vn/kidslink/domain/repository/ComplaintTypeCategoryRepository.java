package vn.kidslink.domain.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ComplaintTypeCategory;

public interface ComplaintTypeCategoryRepository
        extends JpaRepository<ComplaintTypeCategory, ComplaintTypeCategory.ComplaintTypeCategoryId> {

    List<ComplaintTypeCategory> findByComplaintTypeId(UUID complaintTypeId);

    void deleteByComplaintTypeId(UUID complaintTypeId);
}
