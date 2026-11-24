package vn.kidslink.api.fee;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.api.fee.FeeDtos.WebhookResultDto;

/** Public PayOS callback endpoint (whitelisted in SecurityConfig). */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/payos")
public class PayosWebhookController {

    private final FeeService feeService;

    public PayosWebhookController(FeeService feeService) {
        this.feeService = feeService;
    }

    @PostMapping("/webhook")
    public WebhookResultDto webhook(@RequestBody JsonNode payload) {
        return feeService.handleWebhook(payload);
    }
}
