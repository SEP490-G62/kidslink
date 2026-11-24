package vn.kidslink.api.school;

import java.util.List;
import java.util.Map;
import java.util.UUID;
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
import vn.kidslink.common.ConflictException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.security.CurrentUser;

/** System-admin surface: manage every school in the platform. */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/admin/schools")
public class AdminSchoolController {

    private final SchoolRepository schoolRepository;
    private final SchoolMapper mapper;

    public AdminSchoolController(SchoolRepository schoolRepository, SchoolMapper mapper) {
        this.schoolRepository = schoolRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public List<SchoolDtos.SchoolDto> list(@AuthenticationPrincipal CurrentUser principal) {
        requireAdmin(principal);
        return schoolRepository.findAll().stream().map(mapper::toDto).toList();
    }

    @GetMapping("/{schoolId}")
    public SchoolDtos.SchoolDto get(@AuthenticationPrincipal CurrentUser principal, @PathVariable String schoolId) {
        requireAdmin(principal);
        return mapper.toDto(find(schoolId));
    }

    @PostMapping
    public ResponseEntity<SchoolDtos.SchoolDto> create(@AuthenticationPrincipal CurrentUser principal,
                                                       @RequestBody SchoolDtos.SchoolRequest request) {
        requireAdmin(principal);
        School school = new School();
        mapper.apply(school, request);
        if (school.getSchoolName() == null || school.getSchoolName().isBlank()) {
            throw new vn.kidslink.common.BadRequestException("school_name là bắt buộc");
        }
        if (school.getAddress() == null || school.getAddress().isBlank()) {
            throw new vn.kidslink.common.BadRequestException("address là bắt buộc");
        }
        if (request.phone() != null && !request.phone().isBlank()) {
            schoolRepository.findFirstByPhone(request.phone()).ifPresent(existing -> {
                throw new ConflictException("Số điện thoại trường đã tồn tại");
            });
        }
        if (request.email() != null && !request.email().isBlank()) {
            schoolRepository.findFirstByEmail(request.email()).ifPresent(existing -> {
                throw new ConflictException("Email trường đã tồn tại");
            });
        }
        schoolRepository.save(school);
        return ResponseEntity.status(201).body(mapper.toDto(school));
    }

    @PutMapping("/{schoolId}")
    public SchoolDtos.SchoolDto update(@AuthenticationPrincipal CurrentUser principal,
                                       @PathVariable String schoolId,
                                       @RequestBody SchoolDtos.SchoolRequest request) {
        requireAdmin(principal);
        School school = find(schoolId);
        mapper.apply(school, request);
        schoolRepository.save(school);
        return mapper.toDto(school);
    }

    @DeleteMapping("/{schoolId}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser principal, @PathVariable String schoolId) {
        requireAdmin(principal);
        schoolRepository.delete(find(schoolId));
        return Map.of("message", "Đã xoá trường học");
    }

    @PutMapping("/{schoolId}/status")
    public SchoolDtos.SchoolDto updateStatus(@AuthenticationPrincipal CurrentUser principal,
                                             @PathVariable String schoolId,
                                             @RequestBody Map<String, Object> body) {
        requireAdmin(principal);
        School school = find(schoolId);
        Object raw = body.get("status");
        if (raw == null) {
            throw new vn.kidslink.common.BadRequestException("status là bắt buộc");
        }
        school.setStatus(Short.valueOf(String.valueOf(raw)));
        schoolRepository.save(school);
        return mapper.toDto(school);
    }

    private School find(String id) {
        return schoolRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
    }

    private void requireAdmin(CurrentUser principal) {
        if (principal == null || principal.role() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ quản trị hệ thống được thực hiện thao tác này");
        }
    }
}
