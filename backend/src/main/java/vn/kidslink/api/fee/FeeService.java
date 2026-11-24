package vn.kidslink.api.fee;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import vn.kidslink.api.fee.FeeDtos.ClassFeeInput;
import vn.kidslink.api.fee.FeeDtos.ClassFeePaymentsDto;
import vn.kidslink.api.fee.FeeDtos.ClassFeeInfo;
import vn.kidslink.api.fee.FeeDtos.ClassSummary;
import vn.kidslink.api.fee.FeeDtos.FeeDto;
import vn.kidslink.api.fee.FeeDtos.FeeRequest;
import vn.kidslink.api.fee.FeeDtos.FeeSummary;
import vn.kidslink.api.fee.FeeDtos.InvoiceResultDto;
import vn.kidslink.api.fee.FeeDtos.InvoiceDto;
import vn.kidslink.api.fee.FeeDtos.LateFeeInfo;
import vn.kidslink.api.fee.FeeDtos.LateFeePolicyDto;
import vn.kidslink.api.fee.FeeDtos.OfflineResultDto;
import vn.kidslink.api.fee.FeeDtos.PayosFeeItem;
import vn.kidslink.api.fee.FeeDtos.PayosItemResult;
import vn.kidslink.api.fee.FeeDtos.PayosRequest;
import vn.kidslink.api.fee.FeeDtos.PayosResultDto;
import vn.kidslink.api.fee.FeeDtos.PayosStatusDto;
import vn.kidslink.api.fee.FeeDtos.PayosStatusInvoiceDto;
import vn.kidslink.api.fee.FeeDtos.PaymentsSummary;
import vn.kidslink.api.fee.FeeDtos.ParentClassInfo;
import vn.kidslink.api.fee.FeeDtos.ParentFeeDto;
import vn.kidslink.api.fee.FeeDtos.ParentInvoiceDto;
import vn.kidslink.api.fee.FeeDtos.ParentStudentFeesDto;
import vn.kidslink.api.fee.FeeDtos.ParentStudentInfo;
import vn.kidslink.api.fee.FeeDtos.StudentInfo;
import vn.kidslink.api.fee.FeeDtos.StudentPaymentDto;
import vn.kidslink.api.fee.FeeDtos.UnpaidCountDto;
import vn.kidslink.api.fee.FeeDtos.WebhookResultDto;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.ClassFee;
import vn.kidslink.domain.entity.Fee;
import vn.kidslink.domain.entity.Invoice;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.Payment;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.domain.repository.ClassFeeRepository;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.FeeRepository;
import vn.kidslink.domain.repository.InvoiceRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.PaymentRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.domain.repository.StudentClassRepository;

@Service
public class FeeService {

    private static final String PAYOS_BASE_URL = "https://api-merchant.payos.vn/v2";
    private static final Set<String> LATE_FEE_TYPES = Set.of("none", "fixed", "percentage");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final FeeRepository feeRepository;
    private final ClassFeeRepository classFeeRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ClassRepository classRepository;
    private final StudentClassRepository studentClassRepository;
    private final SchoolRepository schoolRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final RestClient restClient;

    public FeeService(FeeRepository feeRepository, ClassFeeRepository classFeeRepository,
                      InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                      ClassRepository classRepository, StudentClassRepository studentClassRepository,
                      SchoolRepository schoolRepository, ParentRepository parentRepository,
                      ParentStudentRepository parentStudentRepository, RestClient.Builder restClientBuilder) {
        this.feeRepository = feeRepository;
        this.classFeeRepository = classFeeRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.classRepository = classRepository;
        this.studentClassRepository = studentClassRepository;
        this.schoolRepository = schoolRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.restClient = restClientBuilder.build();
    }

    // ==================== School admin: fee CRUD ====================

    public List<FeeDto> listFees(UUID schoolId) {
        List<Fee> fees = feeRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId);
        return fees.stream().map(fee -> FeeDto.from(fee,
                classFeeRepository.findByFeeIdAndStatus(fee.getId(), (short) 1))).toList();
    }

    public FeeDto getFee(UUID feeId, UUID schoolId) {
        Fee fee = requireFee(feeId, schoolId);
        return FeeDto.from(fee, classFeeRepository.findByFeeIdAndStatus(feeId, (short) 1));
    }

    @Transactional
    public FeeDto createFee(FeeRequest request, UUID schoolId) {
        validateRequest(request);
        Fee fee = new Fee();
        applyFeeFields(fee, request, schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học")));
        fee = feeRepository.save(fee);
        syncClassFees(fee, request, schoolId);
        return FeeDto.from(fee, classFeeRepository.findByFeeIdAndStatus(fee.getId(), (short) 1));
    }

    @Transactional
    public FeeDto updateFee(UUID feeId, FeeRequest request, UUID schoolId) {
        Fee fee = requireFee(feeId, schoolId);
        if (request.feeName() != null && request.feeName().isBlank()) {
            throw new BadRequestException("Tên phí không được để trống");
        }
        if (request.description() != null && request.description().isBlank()) {
            throw new BadRequestException("Mô tả không được để trống");
        }
        if (request.amount() != null && request.amount().signum() < 0) {
            throw new BadRequestException("Số tiền phải là số hợp lệ và >= 0");
        }
        if (request.feeName() != null) fee.setFeeName(request.feeName().trim());
        if (request.description() != null) fee.setDescription(request.description().trim());
        if (request.amount() != null) fee.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        applyLateFee(fee, request);
        fee = feeRepository.save(fee);
        if (request.classFees() != null || request.classIds() != null) {
            syncClassFees(fee, request, schoolId);
        }
        return FeeDto.from(fee, classFeeRepository.findByFeeIdAndStatus(feeId, (short) 1));
    }

    @Transactional
    public void deleteFee(UUID feeId, UUID schoolId) {
        Fee fee = requireFee(feeId, schoolId);
        long active = classFeeRepository.countByFeeIdAndStatus(feeId, (short) 1);
        if (active > 0) {
            throw new BadRequestException("Không thể xóa phí này vì đang được sử dụng trong "
                    + active + " lớp học. Vui lòng gỡ phí khỏi các lớp học trước khi xóa.");
        }
        classFeeRepository.findByFeeId(feeId).forEach(cf -> cf.setStatus((short) 0));
        feeRepository.delete(fee);
    }

    private Fee requireFee(UUID feeId, UUID schoolId) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phí"));
        if (!fee.getSchool().getId().equals(schoolId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập phí thuộc trường khác");
        }
        return fee;
    }

    private void validateRequest(FeeRequest request) {
        if (request.feeName() == null || request.feeName().isBlank()) {
            throw new BadRequestException("Tên phí là bắt buộc");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new BadRequestException("Mô tả là bắt buộc");
        }
        if (request.amount() == null || request.amount().signum() < 0) {
            throw new BadRequestException("Số tiền phải là số hợp lệ và >= 0");
        }
    }

    private void applyFeeFields(Fee fee, FeeRequest request, School school) {
        fee.setSchool(school);
        fee.setFeeName(request.feeName().trim());
        fee.setDescription(request.description().trim());
        fee.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        applyLateFee(fee, request);
    }

    /** Normalizes late fee fields the same way the legacy controller did. */
    private void applyLateFee(Fee fee, FeeRequest request) {
        String type = request.lateFeeType() == null ? "none"
                : request.lateFeeType().toLowerCase();
        if (!LATE_FEE_TYPES.contains(type)) {
            type = "none";
        }
        BigDecimal value = request.lateFeeValue() == null ? BigDecimal.ZERO : request.lateFeeValue();
        if (value.signum() < 0) value = BigDecimal.ZERO;
        if ("percentage".equals(type) && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            value = BigDecimal.valueOf(100);
        }
        String description = request.lateFeeDescription() == null ? ""
                : request.lateFeeDescription().trim();
        if (!"none".equals(type) && value.signum() <= 0) {
            type = "none";
            value = BigDecimal.ZERO;
        }
        fee.setLateFeeType(type);
        fee.setLateFeeValue(value);
        fee.setLateFeeDescription(description);
    }

    /**
     * Reconciles the fee's active ClassFee rows with the requested class list:
     * adds new rows, updates changed due dates, deactivates missing ones.
     */
    private void syncClassFees(Fee fee, FeeRequest request, UUID schoolId) {
        List<ClassFeeInput> inputs = new ArrayList<>();
        if (request.classFees() != null && !request.classFees().isEmpty()) {
            inputs.addAll(request.classFees());
        } else if (request.classIds() != null) {
            for (String classId : request.classIds()) {
                inputs.add(new ClassFeeInput(classId, request.dueDate()));
            }
        }
        LocalDate defaultDue = request.dueDate() != null ? request.dueDate()
                : YearMonth.now().atEndOfMonth();
        LocalDate today = LocalDate.now();

        Map<UUID, ClassFee> current = new LinkedHashMap<>();
        for (ClassFee cf : classFeeRepository.findByFeeIdAndStatus(fee.getId(), (short) 1)) {
            current.put(cf.getClassEntity().getId(), cf);
        }

        for (ClassFeeInput input : inputs) {
            UUID classId = parseId(input.classId(), "Danh sách lớp chứa ID không hợp lệ");
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Một số lớp áp dụng phí không tồn tại"));
            if (!classEntity.getSchool().getId().equals(schoolId)) {
                throw new ForbiddenException("Không thể áp dụng phí cho lớp thuộc trường khác");
            }
            LocalDate due = input.dueDate() != null ? input.dueDate() : defaultDue;
            if (due.isBefore(today.withDayOfMonth(1))) {
                due = defaultDue;
            }
            ClassFee cf = current.remove(classId);
            if (cf == null) {
                cf = new ClassFee();
                cf.setClassEntity(classEntity);
                cf.setFee(fee);
                cf.setStatus((short) 1);
                cf.setNote("");
            }
            cf.setDueDate(due);
            classFeeRepository.save(cf);
        }
        for (ClassFee removed : current.values()) {
            removed.setStatus((short) 0);
            classFeeRepository.save(removed);
        }
    }

    // ==================== School admin: invoices & payments ====================

    @Transactional
    public InvoiceResultDto createOrGetInvoice(UUID feeId, UUID classFeeId, UUID studentClassId,
                                              UUID schoolId) {
        requireFee(feeId, schoolId);
        ClassFee classFee = classFeeRepository
                .findByIdAndFeeIdAndStatus(classFeeId, feeId, (short) 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin lớp áp dụng phí"));
        StudentClass studentClass = studentClassRepository
                .findByIdAndClassEntityId(studentClassId, classFee.getClassEntity().getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin học sinh trong lớp"));

        Fee fee = classFee.getFee();
        BigDecimal base = baseAmount(fee, studentClass.getDiscount());
        BigDecimal lateFee = BigDecimal.ZERO;
        boolean applied = false;

        Invoice invoice = invoiceRepository
                .findByStudentClassIdAndClassFeeId(studentClassId, classFeeId).orElse(null);
        if (invoice == null) {
            boolean overdue = isOverdue(null, classFee.getDueDate());
            if (overdue) {
                lateFee = lateFeeAmount(fee, base);
                applied = lateFee.signum() > 0;
            }
            invoice = new Invoice();
            invoice.setClassFee(classFee);
            invoice.setStudentClass(studentClass);
            invoice.setDueDate(classFee.getDueDate());
            invoice.setDiscount(studentClass.getDiscount());
            invoice.setAmountDue(base.add(lateFee));
            invoice.setStatus(overdue ? (short) 2 : (short) 0);
            if (applied) {
                invoice.setLateFeeAmount(lateFee);
                invoice.setLateFeeAppliedAt(Instant.now());
            }
            invoice = invoiceRepository.save(invoice);
        } else if (invoice.getStatus() != 1) {
            BigDecimal existing = invoice.getLateFeeAmount() == null ? BigDecimal.ZERO
                    : invoice.getLateFeeAmount();
            if (isOverdue(invoice, classFee.getDueDate()) && existing.signum() == 0) {
                lateFee = lateFeeAmount(fee, base);
                if (lateFee.signum() > 0) {
                    applied = true;
                    invoice.setLateFeeAmount(lateFee);
                    invoice.setLateFeeAppliedAt(Instant.now());
                    invoice.setAmountDue(base.add(lateFee));
                    invoice.setStatus((short) 2);
                    invoice = invoiceRepository.save(invoice);
                }
            } else if (existing.signum() > 0) {
                lateFee = existing;
                applied = true;
            }
        }

        return new InvoiceResultDto(invoice.getId().toString(), studentClassId.toString(),
                classFeeId.toString(), base, lateFee, invoice.getAmountDue(), applied,
                invoice.getDueDate(), invoice.getStatus(), invoice.getDiscount());
    }

    public ClassFeePaymentsDto classFeePayments(UUID feeId, UUID classFeeId, UUID schoolId) {
        requireFee(feeId, schoolId);
        ClassFee classFee = classFeeRepository
                .findByIdAndFeeIdAndStatus(classFeeId, feeId, (short) 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin lớp áp dụng phí"));
        Fee fee = classFee.getFee();
        List<StudentClass> studentClasses = studentClassRepository
                .findByClassEntityId(classFee.getClassEntity().getId());
        Map<UUID, Invoice> invoices = new LinkedHashMap<>();
        for (Invoice inv : invoiceRepository.findByClassFeeId(classFeeId)) {
            invoices.put(inv.getStudentClass().getId(), inv);
        }

        int paid = 0, pending = 0, overdue = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalPaidAmount = BigDecimal.ZERO;
        List<StudentPaymentDto> students = new ArrayList<>();
        for (StudentClass sc : studentClasses) {
            Invoice invoice = invoices.get(sc.getId());
            BigDecimal base = baseAmount(fee, sc.getDiscount());
            BigDecimal amountDue = invoice != null ? invoice.getAmountDue() : base;
            totalAmount = totalAmount.add(amountDue);

            String status;
            String statusText;
            if (invoice != null && invoice.getStatus() == 1) {
                status = "paid";
                statusText = "Đã thanh toán";
                paid++;
                totalPaidAmount = totalPaidAmount.add(amountDue);
            } else if (isOverdue(invoice, classFee.getDueDate())) {
                status = "overdue";
                statusText = "Quá hạn";
                overdue++;
            } else {
                status = "pending";
                statusText = "Chưa thanh toán";
                pending++;
            }
            BigDecimal lateFeeAmount = invoice == null || invoice.getLateFeeAmount() == null
                    ? BigDecimal.ZERO : invoice.getLateFeeAmount();
            students.add(new StudentPaymentDto(
                    sc.getId().toString(), sc.getDiscount(), StudentInfo.from(sc.getStudent()),
                    invoice == null ? null : InvoiceDto.from(invoice),
                    amountDue, classFee.getDueDate(), status, statusText,
                    new LateFeeInfo(lateFeeAmount.signum() > 0, lateFeeAmount, base)));
        }

        BigDecimal pendingAmount = totalAmount.subtract(totalPaidAmount).max(BigDecimal.ZERO);
        return new ClassFeePaymentsDto(
                FeeSummary.from(fee), ClassSummary.from(classFee.getClassEntity()),
                new PaymentsSummary(studentClasses.size(), paid, pending, overdue,
                        totalAmount, totalPaidAmount, pendingAmount),
                students);
    }

    @Transactional
    public OfflineResultDto markPaidOffline(UUID feeId, UUID classFeeId, UUID invoiceId,
                                           BigDecimal amount, UUID schoolId) {
        requireFee(feeId, schoolId);
        classFeeRepository.findByIdAndFeeIdAndStatus(classFeeId, feeId, (short) 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin lớp áp dụng phí"));
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getClassFee().getId().equals(classFeeId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        if (invoice.getStatus() == 1) {
            throw new BadRequestException("Hóa đơn đã được thanh toán");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new BadRequestException("Số tiền phải là số hợp lệ và > 0");
        }
        Payment payment = new Payment();
        payment.setPaymentTime(LocalTime.now().format(TIME_FORMAT));
        payment.setPaymentMethod((short) 0);
        payment.setTotalAmount(amount.setScale(2, RoundingMode.HALF_UP));
        payment = paymentRepository.save(payment);

        invoice.setStatus((short) 1);
        invoice.setPayment(payment);
        invoiceRepository.save(invoice);

        return new OfflineResultDto(invoiceId.toString(), payment.getId().toString(),
                payment.getTotalAmount(), payment.getPaymentMethod());
    }

    // ==================== Parent ====================

    public List<ParentStudentFeesDto> parentFees(UUID userId) {
        return parentFeeStream(userId, false).stream()
                .map(r -> new ParentStudentFeesDto(r.student(), r.classInfo(),
                        r.studentClassId(), r.fees())).toList();
    }

    public UnpaidCountDto unpaidCount(UUID userId) {
        List<ParentStudentFeesDto> data = parentFees(userId);
        return new UnpaidCountDto(data.stream()
                .flatMap(d -> d.fees().stream())
                .filter(f -> !"paid".equals(f.status()))
                .count());
    }

    private record ParentFeeRow(ParentStudentInfo student, ParentClassInfo classInfo,
                                 String studentClassId, List<ParentFeeDto> fees) {
    }

    private List<ParentFeeRow> parentFeeStream(UUID userId, boolean skipPaid) {
        Parent parent = parentRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));
        List<ParentFeeRow> result = new ArrayList<>();
        for (var ps : parentStudentRepository.findByParentId(parent.getId())) {
            List<StudentClass> classes = studentClassRepository
                    .findByStudentId(ps.getStudent().getId());
            if (classes.isEmpty()) {
                result.add(new ParentFeeRow(
                        ParentStudentInfo.from(ps.getStudent()), null, null, List.of()));
                continue;
            }
            // Only the latest academic year's class is billed, matching the legacy portal.
            StudentClass latest = classes.stream()
                    .max(Comparator.comparing(sc -> sc.getClassEntity().getAcademicYear(),
                            Comparator.nullsFirst(Comparator.naturalOrder())))
                    .get();
            ClassEntity latestClass = latest.getClassEntity();
            List<ParentFeeDto> fees = new ArrayList<>();
            for (ClassFee classFee : classFeeRepository
                    .findByClassEntityIdAndStatus(latestClass.getId(), (short) 1)) {
                Invoice invoice = invoiceRepository
                        .findByStudentClassIdAndClassFeeId(latest.getId(), classFee.getId())
                        .orElse(null);
                String status = statusOf(invoice, classFee.getDueDate());
                if (skipPaid && "paid".equals(status)) {
                    continue;
                }
                Fee fee = classFee.getFee();
                BigDecimal base = baseAmount(fee, latest.getDiscount());
                BigDecimal appliedLateFee = BigDecimal.ZERO;
                BigDecimal policyApplied = BigDecimal.ZERO;
                boolean applicable = shouldApplyLateFee(fee);
                if ("overdue".equals(status) && applicable) {
                    appliedLateFee = invoice != null && invoice.getLateFeeAmount() != null
                            ? invoice.getLateFeeAmount() : lateFeeAmount(fee, base);
                    policyApplied = appliedLateFee;
                }
                fees.add(new ParentFeeDto(
                        fee.getId().toString(), fee.getFeeName(), fee.getDescription(),
                        base, base.add(appliedLateFee), base,
                        new LateFeePolicyDto(fee.getLateFeeType(), fee.getLateFeeValue(),
                                fee.getLateFeeDescription(), policyApplied, applicable,
                                appliedLateFee.signum() > 0),
                        classFee.getDueDate(), classFee.getId().toString(), latest.getId().toString(),
                        invoice == null ? null : ParentInvoiceDto.from(invoice),
                        status, statusText(status),
                        "overdue".equals(status) ? base.add(appliedLateFee) : base,
                        invoice != null ? invoice.getDueDate() : classFee.getDueDate()));
            }
            result.add(new ParentFeeRow(ParentStudentInfo.from(ps.getStudent()),
                    ParentClassInfo.from(latestClass), latest.getId().toString(), fees));
        }
        return result;
    }

    // ==================== PayOS ====================

    @Transactional
    public PayosResultDto createPayosPayment(UUID userId, PayosRequest request) {
        List<PayosFeeItem> items = request.items();
        if (items.isEmpty()) {
            throw new BadRequestException(
                    "Cần truyền student_id, class_fee_id, student_class_id hoặc fee_items hợp lệ");
        }
        Parent parent = parentRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));

        class ProcessedFee {
            StudentClass studentClass;
            ClassFee classFee;
            Invoice invoice;
            BigDecimal base;
            BigDecimal lateFee;
            String studentName;
            String studentId;
        }
        List<ProcessedFee> processed = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        School school = null;

        for (PayosFeeItem item : items) {
            UUID studentId = parseId(item.studentId(), "fee_items chứa ID không hợp lệ");
            UUID classFeeId = parseId(item.classFeeId(), "fee_items chứa ID không hợp lệ");
            UUID studentClassId = parseId(item.studentClassId(), "fee_items chứa ID không hợp lệ");
            if (parentStudentRepository.findByParentIdAndStudentId(parent.getId(), studentId).isEmpty()) {
                throw new ForbiddenException("Bạn không có quyền thanh toán cho một trong các học sinh đã chọn");
            }
            StudentClass studentClass = studentClassRepository.findById(studentClassId)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin lớp học"));
            ClassFee classFee = classFeeRepository.findById(classFeeId)
                    .filter(cf -> cf.getStatus() == 1)
                    .orElse(null);
            if (classFee == null
                    || !classFee.getClassEntity().getId().equals(studentClass.getClassEntity().getId())) {
                throw new NotFoundException("Không tìm thấy thông tin khoản phí");
            }
            Invoice invoice;
            if (item.invoiceId() != null) {
                invoice = invoiceRepository.findById(parseId(item.invoiceId(), "fee_items chứa ID không hợp lệ"))
                        .filter(inv -> inv.getStudentClass().getId().equals(studentClassId)
                                && inv.getClassFee().getId().equals(classFeeId))
                        .orElse(null);
            } else {
                invoice = null;
            }
            if (invoice == null) {
                invoice = invoiceRepository
                        .findByStudentClassIdAndClassFeeId(studentClassId, classFeeId).orElse(null);
            }
            if (invoice == null) {
                invoice = new Invoice();
                invoice.setClassFee(classFee);
                invoice.setStudentClass(studentClass);
                invoice.setAmountDue(BigDecimal.ZERO);
                invoice.setDueDate(classFee.getDueDate());
                invoice.setDiscount(studentClass.getDiscount());
            }
            if (invoice.getStatus() == 1) {
                throw new BadRequestException("Một trong các khoản phí đã được thanh toán");
            }

            Fee fee = classFee.getFee();
            BigDecimal base = baseAmount(fee, studentClass.getDiscount());
            if (base.signum() <= 0) {
                throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
            }
            BigDecimal lateFee = BigDecimal.ZERO;
            if (isOverdue(invoice, classFee.getDueDate()) && shouldApplyLateFee(fee)) {
                lateFee = invoice.getLateFeeAmount() != null && invoice.getLateFeeAmount().signum() > 0
                        ? invoice.getLateFeeAmount() : lateFeeAmount(fee, base);
            }
            BigDecimal finalAmount = base.add(lateFee);
            if (finalAmount.signum() <= 0) {
                throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
            }

            ProcessedFee pf = new ProcessedFee();
            pf.studentClass = studentClass;
            pf.classFee = classFee;
            pf.invoice = invoice;
            pf.base = base;
            pf.lateFee = lateFee;
            pf.studentName = studentClass.getStudent().getFullName();
            pf.studentId = studentId.toString();
            processed.add(pf);
            totalAmount = totalAmount.add(finalAmount);

            School feeSchool = classFee.getClassEntity().getSchool();
            if (school == null) {
                school = feeSchool;
            } else if (!school.getId().equals(feeSchool.getId())) {
                throw new BadRequestException(
                        "Không thể thanh toán nhiều khoản thuộc các trường khác nhau trong một yêu cầu");
            }
        }

        PayosConfig config = requirePayos(school);
        long orderCode = generateOrderCode();
        String description = processed.size() == 1
                ? truncate("HP " + processed.get(0).studentName + " - "
                        + processed.get(0).classFee.getFee().getFeeName(), 25)
                : truncate("HP " + processed.get(0).studentName + " +" + (processed.size() - 1) + " phí", 25);
        Instant expiredAt = Instant.now().plusSeconds(15 * 60);
        String returnUrl = "http://localhost:3000/payments/success";
        String cancelUrl = "http://localhost:3000/payments/cancel";

        Map<String, Object> signaturePayload = new TreeMap<>();
        signaturePayload.put("amount", totalAmount.longValue());
        signaturePayload.put("cancelUrl", cancelUrl);
        signaturePayload.put("description", description);
        signaturePayload.put("orderCode", orderCode);
        signaturePayload.put("returnUrl", returnUrl);
        String signature = hmacSha256(signaturePayload, config.checksumKey());

        Map<String, Object> body = new LinkedHashMap<>(signaturePayload);
        body.put("expiredAt", expiredAt.getEpochSecond());
        body.put("items", processed.stream().map(pf -> Map.of(
                "name", truncate(pf.studentName + " - " + pf.classFee.getFee().getFeeName(), 50),
                "quantity", 1,
                "price", pf.base.add(pf.lateFee).longValue())).toList());
        body.put("buyerName", "Phụ huynh KidsLink");
        body.put("signature", signature);

        JsonNode payosData;
        try {
            payosData = restClient.post()
                    .uri(URI.create(PAYOS_BASE_URL + "/payment-requests"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(h -> {
                        h.set("x-client-id", config.clientId());
                        h.set("x-api-key", config.apiKey());
                    })
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw new BadRequestException("Không thể tạo yêu cầu thanh toán PayOS");
        }
        if (payosData == null || (payosData.hasNonNull("code")
                && !"00".equals(payosData.get("code").asText()))) {
            throw new BadRequestException("PayOS trả về lỗi");
        }
        JsonNode data = payosData.has("data") ? payosData.get("data") : payosData;

        List<PayosItemResult> itemResults = new ArrayList<>();
        List<String> invoiceIds = new ArrayList<>();
        for (ProcessedFee pf : processed) {
            BigDecimal finalAmount = pf.base.add(pf.lateFee);
            Invoice invoice = pf.invoice;
            if (invoice.getId() == null) {
                invoice.setAmountDue(finalAmount);
            } else {
                invoice.setAmountDue(finalAmount);
                invoice.setDueDate(pf.classFee.getDueDate());
            }
            invoice.setDiscount(pf.studentClass.getDiscount());
            if (pf.lateFee.signum() > 0) {
                invoice.setLateFeeAmount(pf.lateFee);
                invoice.setLateFeeAppliedAt(Instant.now());
                if (invoice.getStatus() != 1) {
                    invoice.setStatus((short) 2);
                }
            }
            invoice.setPayosOrderCode(orderCode);
            invoice.setPayosCheckoutUrl(text(data, "checkoutUrl", "checkout_url", "shortLink"));
            invoice.setPayosQrCode(text(data, "qrCode", "qrContent", "qrData"));
            invoice.setPayosQrUrl(text(data, "qrCodeURL", "qrCodeUrl", "qrCode"));
            invoice.setPayosExpiredAt(expiredAt);
            invoice = invoiceRepository.save(invoice);
            invoiceIds.add(invoice.getId().toString());
            itemResults.add(new PayosItemResult(
                    invoice.getId().toString(), pf.studentId, pf.studentName,
                    pf.classFee.getId().toString(), pf.classFee.getFee().getId().toString(),
                    pf.classFee.getFee().getFeeName(), finalAmount, pf.base, pf.lateFee));
        }

        return new PayosResultDto(invoiceIds, orderCode, totalAmount, "VND", description,
                text(data, "checkoutUrl", "checkout_url", "shortLink"),
                text(data, "qrCode", "qrContent", "qrData"),
                text(data, "qrCodeURL", "qrCodeUrl", "qrCode"),
                expiredAt, itemResults);
    }

    @Transactional
    public PayosStatusDto checkPayosStatus(UUID userId, Long orderCode) {
        if (orderCode == null) {
            throw new BadRequestException("Thiếu order_code");
        }
        List<Invoice> invoices = invoiceRepository.findAllByPayosOrderCode(orderCode);
        if (invoices.isEmpty()) {
            throw new NotFoundException("Không tìm thấy hóa đơn cho mã thanh toán này");
        }
        School school = invoices.get(0).getClassFee().getClassEntity().getSchool();
        PayosConfig config = requirePayos(school);

        JsonNode payosData;
        try {
            payosData = restClient.get()
                    .uri(URI.create(PAYOS_BASE_URL + "/payment-requests/" + orderCode))
                    .headers(h -> {
                        h.set("x-client-id", config.clientId());
                        h.set("x-api-key", config.apiKey());
                    })
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            throw new BadRequestException("Không thể kiểm tra trạng thái thanh toán PayOS");
        }
        JsonNode data = payosData != null && payosData.has("data") ? payosData.get("data") : payosData;
        String status = data == null || data.get("status") == null ? ""
                : data.get("status").asText().toUpperCase();
        boolean isPaid = Set.of("PAID", "COMPLETED", "SUCCEEDED", "SUCCESS", "PAYMENT_SUCCESS")
                .contains(status);

        List<String> updated = isPaid ? markInvoicesPaid(invoices, data) : List.of();
        List<PayosStatusInvoiceDto> summaries = invoices.stream()
                .map(inv -> new PayosStatusInvoiceDto(inv.getId().toString(), inv.getStatus(),
                        inv.getStudentClass().getStudent().getId().toString(),
                        inv.getClassFee().getId().toString()))
                .toList();
        return new PayosStatusDto(orderCode, status, isPaid, updated, summaries);
    }

    // ==================== Webhook ====================

    @Transactional
    public WebhookResultDto handleWebhook(JsonNode payload) {
        JsonNode data = payload != null && payload.has("data") ? payload.get("data") : payload;
        if (data == null || data.get("orderCode") == null) {
            throw new BadRequestException("Missing orderCode");
        }
        long orderCode = data.get("orderCode").asLong();
        List<Invoice> invoices = invoiceRepository.findAllByPayosOrderCode(orderCode);
        if (invoices.isEmpty()) {
            throw new NotFoundException("Invoices not found for orderCode");
        }
        String status = data.hasNonNull("status") ? data.get("status").asText().toUpperCase() : "";
        boolean isSuccess = Set.of("PAID", "COMPLETED", "SUCCEEDED", "SUCCESS", "PAYMENT_SUCCESS")
                .contains(status)
                || (payload != null && payload.hasNonNull("code")
                        && "00".equals(payload.get("code").asText()));
        if (!isSuccess) {
            return new WebhookResultDto(true, "Webhook received but status is not paid",
                    orderCode, List.of());
        }
        List<String> updated = markInvoicesPaid(invoices, data);
        return new WebhookResultDto(true, "Invoices updated successfully", orderCode, updated);
    }

    /** Creates an online Payment per invoice and flips status to paid. Shared by status check + webhook. */
    public List<String> markInvoicesPaid(List<Invoice> invoices, JsonNode meta) {
        String transactionId = text(meta, "transactionId", "reference", "id", "payos_transaction_id");
        List<String> updated = new ArrayList<>();
        for (Invoice invoice : invoices) {
            if (invoice.getStatus() == 1) {
                continue;
            }
            Payment payment = new Payment();
            payment.setPaymentTime(LocalTime.now().format(TIME_FORMAT));
            payment.setPaymentMethod((short) 1);
            payment.setTotalAmount(invoice.getAmountDue());
            payment = paymentRepository.save(payment);
            invoice.setStatus((short) 1);
            invoice.setPayment(payment);
            if (transactionId != null) {
                invoice.setPayosTransactionId(transactionId);
            }
            invoiceRepository.save(invoice);
            updated.add(invoice.getId().toString());
        }
        return updated;
    }

    // ==================== Helpers ====================

    private record PayosConfig(String clientId, String apiKey, String checksumKey) {
    }

    private PayosConfig requirePayos(School school) {
        if (school == null || !Boolean.TRUE.equals(school.getPayosActive())
                || school.getPayosClientId() == null || school.getPayosApiKey() == null
                || school.getPayosChecksumKey() == null) {
            throw new BadRequestException("Trường chưa cấu hình thanh toán online");
        }
        return new PayosConfig(school.getPayosClientId(), school.getPayosApiKey(),
                school.getPayosChecksumKey());
    }

    /** Whole-VND amount after discount: fee.amount * (1 - discount/100). */
    private BigDecimal baseAmount(Fee fee, BigDecimal discountPercent) {
        BigDecimal factor = BigDecimal.ONE.subtract(
                discountPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        return fee.getAmount().multiply(factor).setScale(0, RoundingMode.HALF_UP);
    }

    private boolean shouldApplyLateFee(Fee fee) {
        return fee.getLateFeeType() != null && !"none".equals(fee.getLateFeeType())
                && fee.getLateFeeValue() != null && fee.getLateFeeValue().signum() > 0;
    }

    private BigDecimal lateFeeAmount(Fee fee, BigDecimal base) {
        if (!shouldApplyLateFee(fee)) {
            return BigDecimal.ZERO;
        }
        if ("fixed".equals(fee.getLateFeeType())) {
            return fee.getLateFeeValue().setScale(0, RoundingMode.HALF_UP);
        }
        if ("percentage".equals(fee.getLateFeeType())) {
            return base.multiply(fee.getLateFeeValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private boolean isOverdue(Invoice invoice, LocalDate classFeeDueDate) {
        if (invoice != null && invoice.getStatus() == 2) {
            return true;
        }
        LocalDate due = invoice != null && invoice.getDueDate() != null
                ? invoice.getDueDate() : classFeeDueDate;
        return due != null && LocalDate.now().isAfter(due);
    }

    private String statusOf(Invoice invoice, LocalDate classFeeDueDate) {
        if (invoice != null && invoice.getStatus() == 1) {
            return "paid";
        }
        return isOverdue(invoice, classFeeDueDate) ? "overdue" : "pending";
    }

    private String statusText(String status) {
        return switch (status) {
            case "paid" -> "Đã thanh toán";
            case "overdue" -> "Quá hạn";
            default -> "Chưa thanh toán";
        };
    }

    private UUID parseId(String value, String message) {
        try {
            return UUID.fromString(Objects.requireNonNull(value, ""));
        } catch (Exception e) {
            throw new BadRequestException(message);
        }
    }

    private long generateOrderCode() {
        String raw = (System.currentTimeMillis() / 1000)
                + String.valueOf(100 + new java.util.Random().nextInt(900));
        return Long.parseLong(raw.substring(Math.max(0, raw.length() - 13)));
    }

    private String truncate(String value, int max) {
        String base = value == null ? "" : value.trim();
        return base.length() > max ? base.substring(0, max) : base;
    }

    private String text(JsonNode node, String... fields) {
        if (node == null) {
            return null;
        }
        for (String field : fields) {
            if (node.hasNonNull(field)) {
                return node.get(field).asText();
            }
        }
        return null;
    }

    /** HMAC-SHA256 over the PayOS "k=v&k=v" sorted signing string. */
    private String hmacSha256(Map<String, Object> payload, String checksumKey) {
        try {
            StringBuilder signing = new StringBuilder();
            payload.forEach((k, v) -> signing.append(k).append('=').append(v).append('&'));
            String signingString = signing.substring(0, signing.length() - 1);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(signingString.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể ký yêu cầu PayOS", e);
        }
    }
}
