package vn.kidslink.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "schools")
public class School extends BaseEntity {

    @Column(name = "school_name", nullable = false)
    private String schoolName;

    @Column(nullable = false)
    private String address;

    @Column(length = 30, unique = true)
    private String phone;

    @Column(unique = true)
    private String email;

    @Column(name = "logo_url", nullable = false)
    private String logoUrl = "";

    @Column(nullable = false)
    private Short status = 1;

    @Column(name = "qr_data")
    private String qrData;

    @Column(name = "payos_client_id")
    private String payosClientId;

    @Column(name = "payos_api_key")
    private String payosApiKey;

    @Column(name = "payos_checksum_key")
    private String payosChecksumKey;

    @Column(name = "payos_account_number", length = 64)
    private String payosAccountNumber;

    @Column(name = "payos_account_name")
    private String payosAccountName;

    @Column(name = "payos_bank_code", length = 64)
    private String payosBankCode;

    @Column(name = "payos_active", nullable = false)
    private Boolean payosActive = false;

    @Column(name = "payos_webhook_url")
    private String payosWebhookUrl;
}
