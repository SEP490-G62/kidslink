package vn.kidslink.api.fee;

import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.api.fee.FeeDtos.PayosRequest;
import vn.kidslink.api.fee.FeeDtos.PayosResultDto;
import vn.kidslink.api.fee.FeeDtos.PayosStatusDto;
import vn.kidslink.api.fee.FeeDtos.ParentStudentFeesDto;
import vn.kidslink.api.fee.FeeDtos.UnpaidCountDto;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.domain.Role;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/parent/fees")
public class ParentFeeController {

    private final FeeService feeService;

    public ParentFeeController(FeeService feeService) {
        this.feeService = feeService;
    }

    @GetMapping
    public List<ParentStudentFeesDto> list(@AuthenticationPrincipal CurrentUser user) {
        return feeService.parentFees(userId(user));
    }

    @GetMapping("/unpaid-count")
    public UnpaidCountDto unpaidCount(@AuthenticationPrincipal CurrentUser user) {
        return feeService.unpaidCount(userId(user));
    }

    @PostMapping("/payos")
    public PayosResultDto createPayos(@AuthenticationPrincipal CurrentUser user,
                                      @RequestBody PayosRequest request) {
        return feeService.createPayosPayment(userId(user), request);
    }

    @PostMapping("/payos/status")
    public PayosStatusDto checkStatus(@AuthenticationPrincipal CurrentUser user,
                                      @RequestBody FeeDtos.PayosOrderCodeRequest request) {
        return feeService.checkPayosStatus(userId(user), request.orderCode());
    }

    private UUID userId(CurrentUser user) {
        if (user == null || user.role() != Role.PARENT) {
            throw new ForbiddenException("Chỉ phụ huynh được thực hiện thao tác này");
        }
        return UUID.fromString(user.id());
    }
}
