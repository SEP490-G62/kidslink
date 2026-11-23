package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    List<Invoice> findByClassFeeId(UUID classFeeId);

    Optional<Invoice> findByStudentClassIdAndClassFeeId(UUID studentClassId, UUID classFeeId);

    Optional<Invoice> findByPayosOrderCode(Long payosOrderCode);

    List<Invoice> findByStudentClassStudentId(UUID studentId);
}
