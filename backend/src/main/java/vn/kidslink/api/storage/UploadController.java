package vn.kidslink.api.storage;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.kidslink.infra.storage.StorageService;

@RestController
@RequestMapping("/api")
public class UploadController {

    private final StorageService storageService;

    public UploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    public record UploadResult(String url, String publicId) {
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResult upload(@RequestParam("file") MultipartFile file) {
        StorageService.StoredFile stored = storageService.uploadImage(file);
        return new UploadResult(stored.url(), stored.publicId());
    }
}
