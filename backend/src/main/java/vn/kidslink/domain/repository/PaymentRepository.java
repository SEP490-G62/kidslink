package vn.kidslink.domain.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

}
