package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Join table ComplaintType <-> category (legacy ComplaintType.category: string[]). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "complaint_type_categories")
@IdClass(ComplaintTypeCategory.ComplaintTypeCategoryId.class)
public class ComplaintTypeCategory {

    @Id
    @Column(name = "complaint_type_id", nullable = false)
    private UUID complaintTypeId;

    @Id
    @Column(nullable = false, length = 20)
    private String category;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ComplaintTypeCategoryId implements Serializable {
        private UUID complaintTypeId;
        private String category;

        public ComplaintTypeCategoryId(UUID complaintTypeId, String category) {
            this.complaintTypeId = complaintTypeId;
            this.category = category;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ComplaintTypeCategoryId that)) return false;
            return Objects.equals(complaintTypeId, that.complaintTypeId) && Objects.equals(category, that.category);
        }

        @Override
        public int hashCode() {
            return Objects.hash(complaintTypeId, category);
        }
    }
}
