package vn.kidslink.api.fee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.ClassFee;
import vn.kidslink.domain.entity.Fee;
import vn.kidslink.domain.entity.Invoice;
import vn.kidslink.domain.entity.Payment;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.StudentClass;

public final class FeeDtos {

    private FeeDtos() {
    }

    // ---------- School admin payloads ----------

    public record ClassFeeInput(String classId, LocalDate dueDate) {
    }

    public record FeeRequest(
            @NotBlank String feeName,
            @NotBlank String description,
            @NotNull BigDecimal amount,
            List<String> classIds,
            LocalDate dueDate,
            String lateFeeType,
            BigDecimal lateFeeValue,
            String lateFeeDescription,
            List<ClassFeeInput> classFees) {
    }

    public record ClassFeeInfo(
            String classFeeId, String classId, String className,
            String academicYear, LocalDate dueDate) {

        static ClassFeeInfo from(ClassFee cf) {
            ClassEntity c = cf.getClassEntity();
            return new ClassFeeInfo(
                    cf.getId().toString(), c.getId().toString(), c.getClassName(),
                    c.getAcademicYear(), cf.getDueDate());
        }
    }

    public record FeeDto(
            String id, String schoolId, String feeName, String description,
            BigDecimal amount, String lateFeeType, BigDecimal lateFeeValue,
            String lateFeeDescription, List<String> classIds, List<ClassFeeInfo> classes) {

        static FeeDto from(Fee fee, List<ClassFee> classFees) {
            return new FeeDto(
                    fee.getId().toString(),
                    fee.getSchool().getId().toString(),
                    fee.getFeeName(),
                    fee.getDescription(),
                    fee.getAmount(),
                    fee.getLateFeeType(),
                    fee.getLateFeeValue(),
                    fee.getLateFeeDescription(),
                    classFees.stream().map(cf -> cf.getClassEntity().getId().toString()).toList(),
                    classFees.stream().map(ClassFeeInfo::from).toList());
        }
    }

    // ---------- Class fee payments ----------

    public record FeeSummary(String id, String feeName, String description, BigDecimal amount) {
        static FeeSummary from(Fee fee) {
            return new FeeSummary(fee.getId().toString(), fee.getFeeName(),
                    fee.getDescription(), fee.getAmount());
        }
    }

    public record ClassSummary(String id, String className, String academicYear) {
        static ClassSummary from(ClassEntity c) {
            return new ClassSummary(c.getId().toString(), c.getClassName(), c.getAcademicYear());
        }
    }

    public record PaymentSummaryDto(
            String id, Short paymentMethod, String paymentTime, BigDecimal totalAmount) {
        static PaymentSummaryDto from(Payment p) {
            return new PaymentSummaryDto(p.getId().toString(), p.getPaymentMethod(),
                    p.getPaymentTime(), p.getTotalAmount());
        }
    }

    public record InvoiceDto(
            String id, BigDecimal amountDue, LocalDate dueDate, Short status,
            BigDecimal discount, PaymentSummaryDto payment) {
        static InvoiceDto from(Invoice inv) {
            return new InvoiceDto(inv.getId().toString(), inv.getAmountDue(), inv.getDueDate(),
                    inv.getStatus(), inv.getDiscount(),
                    inv.getPayment() == null ? null : PaymentSummaryDto.from(inv.getPayment()));
        }
    }

    public record StudentInfo(
            String id, String fullName, String avatarUrl, Short gender, Short status) {
        static StudentInfo from(Student s) {
            return new StudentInfo(s.getId().toString(), s.getFullName(), s.getAvatarUrl(),
                    s.getGender(), s.getStatus());
        }
    }

    public record LateFeeInfo(Boolean isApplied, BigDecimal amount, BigDecimal baseAmount) {
    }

    public record StudentPaymentDto(
            String studentClassId, BigDecimal discount, StudentInfo student,
            InvoiceDto invoice, BigDecimal amountDue, LocalDate dueDate,
            String status, String statusText, LateFeeInfo lateFeeInfo) {
    }

    public record PaymentsSummary(
            int totalStudents, int paid, int pending, int overdue,
            BigDecimal totalAmount, BigDecimal totalPaidAmount, BigDecimal totalPendingAmount) {
    }

    public record ClassFeePaymentsDto(
            FeeSummary fee, ClassSummary classInfo, PaymentsSummary summary,
            List<StudentPaymentDto> students) {
    }

    public record InvoiceResultDto(
            String invoiceId, String studentClassId, String classFeeId,
            BigDecimal baseAmount, BigDecimal lateFeeAmount, BigDecimal totalAmount,
            boolean isLateFeeApplied, LocalDate dueDate, Short status, BigDecimal discount) {
    }

    public record OfflineRequest(@NotNull BigDecimal amount) {
    }

    public record OfflineResultDto(
            String invoiceId, String paymentId, BigDecimal amount, Short paymentMethod) {
    }

    // ---------- Parent payloads ----------

    public record ParentStudentInfo(String id, String fullName, String avatarUrl) {
        static ParentStudentInfo from(Student s) {
            return new ParentStudentInfo(s.getId().toString(), s.getFullName(), s.getAvatarUrl());
        }
    }

    public record ParentClassInfo(String id, String className, String academicYear) {
        static ParentClassInfo from(ClassEntity c) {
            return new ParentClassInfo(c.getId().toString(), c.getClassName(), c.getAcademicYear());
        }
    }

    public record LateFeePolicyDto(
            String type, BigDecimal value, String description,
            BigDecimal appliedAmount, boolean isApplicable, boolean isApplied) {
    }

    public record ParentInvoiceDto(
            String id, BigDecimal amountDue, LocalDate dueDate, Short status,
            String paymentId, BigDecimal discount, BigDecimal lateFeeAmount) {
        static ParentInvoiceDto from(Invoice inv) {
            return new ParentInvoiceDto(inv.getId().toString(), inv.getAmountDue(),
                    inv.getDueDate(), inv.getStatus(),
                    inv.getPayment() == null ? null : inv.getPayment().getId().toString(),
                    inv.getDiscount(), inv.getLateFeeAmount());
        }
    }

    public record ParentFeeDto(
            String feeId, String feeName, String description,
            BigDecimal amount, BigDecimal amountWithLateFee, BigDecimal baseAmount,
            LateFeePolicyDto lateFee, LocalDate dueDate, String classFeeId, String studentClassId,
            ParentInvoiceDto invoice, String status, String statusText,
            BigDecimal totalAmountDisplay, LocalDate effectiveDueDate) {
    }

    public record ParentStudentFeesDto(
            ParentStudentInfo student, ParentClassInfo classInfo, String studentClassId,
            List<ParentFeeDto> fees) {
    }

    public record UnpaidCountDto(long unpaidCount) {
    }

    // ---------- PayOS ----------

    public record PayosFeeItem(
            String studentId, String classFeeId, String studentClassId, String invoiceId) {
    }

    public record PayosRequest(
            List<PayosFeeItem> feeItems, String studentId, String classFeeId,
            String studentClassId, String invoiceId) {

        List<PayosFeeItem> items() {
            if (feeItems != null && !feeItems.isEmpty()) {
                return feeItems;
            }
            if (studentId != null && classFeeId != null && studentClassId != null) {
                return List.of(new PayosFeeItem(studentId, classFeeId, studentClassId, invoiceId));
            }
            return List.of();
        }
    }

    public record PayosOrderCodeRequest(Long orderCode) {
    }

    public record PayosItemResult(
            String invoiceId, String studentId, String studentName, String classFeeId,
            String feeId, String feeName, BigDecimal amount, BigDecimal baseAmount,
            BigDecimal lateFeeAmount) {
    }

    public record PayosResultDto(
            List<String> invoiceIds, long orderCode, BigDecimal amount, String currency,
            String description, String checkoutUrl, String qrCode, String qrUrl,
            Instant expiredAt, List<PayosItemResult> items) {
    }

    public record PayosStatusInvoiceDto(
            String invoiceId, Short status, String studentId, String classFeeId) {
    }

    public record PayosStatusDto(
            long orderCode, String status, boolean isPaid,
            List<String> updatedInvoices, List<PayosStatusInvoiceDto> invoices) {
    }

    public record WebhookResultDto(
            boolean success, String message, Long orderCode, List<String> updatedInvoices) {
    }
}
