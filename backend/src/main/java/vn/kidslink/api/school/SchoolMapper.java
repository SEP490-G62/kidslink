package vn.kidslink.api.school;

import org.springframework.stereotype.Component;
import vn.kidslink.domain.entity.School;

/** Maps between {@link SchoolDtos.SchoolRequest} and the flat {@link School} entity. */
@Component
public class SchoolMapper {

    public SchoolDtos.SchoolDto toDto(School school) {
        return SchoolDtos.toDto(school);
    }

    public void apply(School school, SchoolDtos.SchoolRequest request) {
        if (request.schoolName() != null) {
            school.setSchoolName(request.schoolName().trim());
        }
        if (request.address() != null) {
            school.setAddress(request.address().trim());
        }
        if (request.phone() != null) {
            school.setPhone(request.phone().trim());
        }
        if (request.email() != null) {
            school.setEmail(request.email().trim());
        }
        if (request.logoUrl() != null) {
            school.setLogoUrl(request.logoUrl().trim());
        }
        if (request.status() != null) {
            school.setStatus(request.status());
        }
        if (request.qrData() != null) {
            school.setQrData(request.qrData());
        }

        SchoolDtos.PayosConfigDto payos = request.payosConfig();
        if (payos != null) {
            school.setPayosClientId(payos.clientId());
            school.setPayosApiKey(payos.apiKey());
            school.setPayosChecksumKey(payos.checksumKey());
            school.setPayosAccountNumber(payos.accountNumber());
            school.setPayosAccountName(payos.accountName());
            school.setPayosBankCode(payos.bankCode());
            if (payos.active() != null) {
                school.setPayosActive(payos.active());
            }
            school.setPayosWebhookUrl(payos.webhookUrl());
        }

        // Flat fields win when both shapes are present.
        if (request.payosClientId() != null) {
            school.setPayosClientId(request.payosClientId());
        }
        if (request.payosApiKey() != null) {
            school.setPayosApiKey(request.payosApiKey());
        }
        if (request.payosChecksumKey() != null) {
            school.setPayosChecksumKey(request.payosChecksumKey());
        }
        if (request.payosAccountNumber() != null) {
            school.setPayosAccountNumber(request.payosAccountNumber());
        }
        if (request.payosAccountName() != null) {
            school.setPayosAccountName(request.payosAccountName());
        }
        if (request.payosBankCode() != null) {
            school.setPayosBankCode(request.payosBankCode());
        }
        if (request.payosActive() != null) {
            school.setPayosActive(request.payosActive());
        }
        if (request.payosWebhookUrl() != null) {
            school.setPayosWebhookUrl(request.payosWebhookUrl());
        }
    }
}
