package vn.kidslink.api.fee;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.api.fee.FeeDtos.ClassFeePaymentsDto;
import vn.kidslink.api.fee.FeeDtos.FeeDto;
import vn.kidslink.api.fee.FeeDtos.FeeRequest;
import vn.kidslink.api.fee.FeeDtos.InvoiceResultDto;
import vn.kidslink.api.fee.FeeDtos.OfflineRequest;
import vn.kidslink.api.fee.FeeDtos.OfflineResultDto;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.domain.Role;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/school-admin/fees")
public class SchoolAdminFeeController {

    private final FeeService feeService;

    public SchoolAdminFeeController(FeeService feeService) {
        this.feeService = feeService;
    }

    @GetMapping
    public List<FeeDto> list(@AuthenticationPrincipal CurrentUser user) {
        return feeService.listFees(schoolId(user));
    }

    @PostMapping
    public ResponseEntity<FeeDto> create(@AuthenticationPrincipal CurrentUser user,
                                         @Valid @RequestBody FeeRequest request) {
        FeeDto dto = feeService.createFee(request, schoolId(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    public FeeDto get(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        return feeService.getFee(id, schoolId(user));
    }

    @PutMapping("/{id}")
    public FeeDto update(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id,
                         @Valid @RequestBody FeeRequest request) {
        return feeService.updateFee(id, request, schoolId(user));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        feeService.deleteFee(id, schoolId(user));
        return Map.of("message", "Xóa phí thành công");
    }

    @GetMapping("/{id}/classes/{classFeeId}/payments")
    public ClassFeePaymentsDto payments(@AuthenticationPrincipal CurrentUser user,
                                        @PathVariable UUID id, @PathVariable UUID classFeeId) {
        return feeService.classFeePayments(id, classFeeId, schoolId(user));
    }

    @PostMapping("/{id}/classes/{classFeeId}/students/{studentClassId}/invoice")
    public InvoiceResultDto createInvoice(@AuthenticationPrincipal CurrentUser user,
                                          @PathVariable UUID id, @PathVariable UUID classFeeId,
                                          @PathVariable UUID studentClassId) {
        return feeService.createOrGetInvoice(id, classFeeId, studentClassId, schoolId(user));
    }

    @PostMapping("/{id}/classes/{classFeeId}/payments/{invoiceId}/offline")
    public OfflineResultDto payOffline(@AuthenticationPrincipal CurrentUser user,
                                       @PathVariable UUID id, @PathVariable UUID classFeeId,
                                       @PathVariable UUID invoiceId,
                                       @Valid @RequestBody OfflineRequest request) {
        return feeService.markPaidOffline(id, classFeeId, invoiceId, request.amount(),
                schoolId(user));
    }

    private UUID schoolId(CurrentUser user) {
        if (user == null || user.role() != Role.SCHOOL_ADMIN || user.schoolId() == null) {
            throw new ForbiddenException("Chỉ quản trị trường học được thực hiện thao tác này");
        }
        return UUID.fromString(user.schoolId());
    }
}
