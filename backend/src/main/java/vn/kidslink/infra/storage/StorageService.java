package vn.kidslink.infra.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.kidslink.common.BadRequestException;

/** Stores images in MinIO under {@code uploads/}; serves them at the public read-only endpoint. */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;
    private final MinioClient client;
    private final StorageProperties properties;
    private static final String FOLDER = "uploads";

    public StorageService(MinioClient client, StorageProperties properties) {
        this.client = client;
        this.properties = properties;
    }


    @PostConstruct
    void ensureBucket() {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(properties.bucket()).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
                String policy = """
                        {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},
                        "Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}
                        """.formatted(properties.bucket()).replaceAll("\\s+", "");
                client.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(properties.bucket()).config(policy).build());
            }
        } catch (Exception e) {
            log.warn("MinIO bucket check failed at startup: {}", e.getMessage());
        }
    }

    public record StoredFile(String url, String publicId) {
    }

    public StoredFile uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tệp ảnh");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Chỉ hỗ trợ tệp ảnh (JPEG, PNG, GIF, WebP)");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BadRequestException("Kích thước ảnh vượt quá 10MB");
        }
        String objectName = FOLDER + "/" + UUID.randomUUID() + "." + extension(file, contentType);
        try {
            client.putObject(PutObjectArgs.builder()
                    .bucket(properties.bucket())
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (IOException e) {
            throw new BadRequestException("Không đọc được tệp tải lên");
        } catch (Exception e) {
            log.error("MinIO upload failed", e);
            throw new BadRequestException("Tải lên thất bại, vui lòng thử lại");
        }
        String url = properties.publicEndpoint() + "/" + properties.bucket() + "/" + objectName;
        return new StoredFile(url, objectName);
    }

    private String extension(MultipartFile file, String contentType) {
        String original = file.getOriginalFilename();
        if (original != null) {
            int dot = original.lastIndexOf('.');
            if (dot >= 0 && dot < original.length() - 1) {
                String ext = original.substring(dot + 1).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
                if (!ext.isEmpty() && ext.length() <= 5) {
                    return "jpeg".equals(ext) ? "jpg" : ext;
                }
            }
        }
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }
}
