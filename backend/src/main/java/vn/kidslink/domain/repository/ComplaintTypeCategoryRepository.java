package vn.kidslink.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.ComplaintTypeCategory;

public interface ComplaintTypeCategoryRepository
        extends JpaRepository<ComplaintTypeCategory, ComplaintTypeCategory.ComplaintTypeCategoryId> {
}
