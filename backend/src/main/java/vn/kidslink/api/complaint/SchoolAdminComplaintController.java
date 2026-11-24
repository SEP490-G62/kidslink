package vn.kidslink.api.complaint;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.Complaint;
import vn.kidslink.domain.entity.ComplaintType;
import vn.kidslink.domain.entity.ComplaintTypeCategory;
import vn.kidslink.domain.repository.ComplaintRepository;
import vn.kidslink.domain.repository.ComplaintTypeCategoryRepository;
import vn.kidslink.domain.repository.ComplaintTypeRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@RequestMapping("/api/school-admin/complaints")
public class SchoolAdminComplaintController {

    private final ComplaintRepository complaintRepository;
    private final ComplaintTypeRepository complaintTypeRepository;
    private final ComplaintTypeCategoryRepository complaintTypeCategoryRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;

    public SchoolAdminComplaintController(ComplaintRepository complaintRepository,
                                          ComplaintTypeRepository complaintTypeRepository,
                                          ComplaintTypeCategoryRepository complaintTypeCategoryRepository,
                                          UserRepository userRepository,
                                          SchoolRepository schoolRepository) {
        this.complaintRepository = complaintRepository;
        this.complaintTypeRepository = complaintTypeRepository;
        this.complaintTypeCategoryRepository = complaintTypeCategoryRepository;
        this.userRepository = userRepository;
        this.schoolRepository = schoolRepository;
    }

    // ---------- Complaints ----------

    @GetMapping("/stats")
    public ComplaintDtos.ComplaintStats stats(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireAdminSchool(user);
        List<Complaint> all = complaintRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId);
        Set<UUID> teacherIds = roleIds(schoolId, Role.TEACHER);
        Set<UUID> parentIds = roleIds(schoolId, Role.PARENT);
        return new ComplaintDtos.ComplaintStats(
                countsOf(all),
                countsOf(all.stream().filter(c -> teacherIds.contains(c.getUser().getId())).toList()),
                countsOf(all.stream().filter(c -> parentIds.contains(c.getUser().getId())).toList()));
    }

    @GetMapping
    public List<ComplaintDtos.ComplaintDto> list(@AuthenticationPrincipal CurrentUser user,
                                                 @RequestParam(required = false) String category,
                                                 @RequestParam(required = false) String status) {
        UUID schoolId = requireAdminSchool(user);
        Set<UUID> userIds;
        if ("teacher".equals(category)) {
            userIds = roleIds(schoolId, Role.TEACHER);
        } else if ("parent".equals(category)) {
            userIds = roleIds(schoolId, Role.PARENT);
        } else {
            userIds = roleIds(schoolId, Role.TEACHER);
            userIds.addAll(roleIds(schoolId, Role.PARENT));
        }
        return complaintRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .filter(c -> userIds.contains(c.getUser().getId()))
                .filter(c -> status == null || status.isBlank()
                        || ("pending/approve/reject".contains(status) && c.getStatus().equals(status)))
                .map(ComplaintDtos.ComplaintDto::from)
                .toList();
    }

    @GetMapping("/{complaintId}")
    public ComplaintDtos.ComplaintDetailDto detail(@AuthenticationPrincipal CurrentUser user,
                                                   @PathVariable String complaintId) {
        UUID schoolId = requireAdminSchool(user);
        Complaint complaint = complaintOfSchool(complaintId, schoolId, "Không tìm thấy đơn");
        var type = complaint.getComplaintType();
        return ComplaintDtos.ComplaintDetailDto.from(complaint, new ComplaintDtos.ComplaintTypeDto(
                type.getId().toString(), type.getName(), type.getDescription(),
                complaintTypeCategoryRepository.findByComplaintTypeId(type.getId()).stream()
                        .map(ComplaintTypeCategory::getCategory).toList()));
    }

    @PutMapping("/{complaintId}/approve")
    public ComplaintDtos.ComplaintDetailDto approve(@AuthenticationPrincipal CurrentUser user,
                                                    @PathVariable String complaintId,
                                                    @RequestBody(required = false) ComplaintDtos.RespondRequest request) {
        UUID schoolId = requireAdminSchool(user);
        Complaint complaint = complaintOfSchool(complaintId, schoolId, "Không tìm thấy đơn");
        complaint.setStatus("approve");
        if (request != null && request.response() != null && !request.response().isBlank()) {
            complaint.setResponse(request.response().trim());
        }
        complaintRepository.save(complaint);
        return detail(user, complaintId);
    }

    @PutMapping("/{complaintId}/reject")
    public ComplaintDtos.ComplaintDetailDto reject(@AuthenticationPrincipal CurrentUser user,
                                                   @PathVariable String complaintId,
                                                   @RequestBody(required = false) ComplaintDtos.RespondRequest request) {
        UUID schoolId = requireAdminSchool(user);
        Complaint complaint = complaintOfSchool(complaintId, schoolId, "Không tìm thấy đơn");
        complaint.setStatus("reject");
        complaint.setResponse(request == null || request.response() == null || request.response().isBlank()
                ? "" : request.response().trim());
        complaintRepository.save(complaint);
        return detail(user, complaintId);
    }

    // ---------- Complaint types ----------

    @GetMapping("/types/list")
    public List<ComplaintDtos.ComplaintTypeDto> listTypes(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireAdminSchool(user);
        return complaintTypeRepository.findBySchoolIdOrderByNameAsc(schoolId).stream()
                .map(type -> new ComplaintDtos.ComplaintTypeDto(
                        type.getId().toString(), type.getName(), type.getDescription(),
                        complaintTypeCategoryRepository.findByComplaintTypeId(type.getId()).stream()
                                .map(ComplaintTypeCategory::getCategory).toList()))
                .toList();
    }

    @PostMapping("/types")
    @Transactional
    public ResponseEntity<ComplaintDtos.ComplaintTypeDto> createType(@AuthenticationPrincipal CurrentUser user,
                                                                     @RequestBody ComplaintDtos.ComplaintTypeRequest request) {
        UUID schoolId = requireAdminSchool(user);
        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException("Vui lòng nhập tên loại đơn");
        }
        List<String> categories = ComplaintDtos.normalizeCategories(request.category());
        if (categories.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ít nhất một loại người dùng (teacher hoặc parent)");
        }
        if (typeByName(schoolId, request.name().trim()).isPresent()) {
            throw new BadRequestException("Loại đơn này đã tồn tại");
        }
        var school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
        ComplaintType type = new ComplaintType();
        type.setSchool(school);
        type.setName(request.name().trim());
        type.setDescription(request.description() == null ? "" : request.description().trim());
        complaintTypeRepository.save(type);
        saveCategories(type.getId(), categories);
        return ResponseEntity.status(201).body(new ComplaintDtos.ComplaintTypeDto(
                type.getId().toString(), type.getName(), type.getDescription(), categories));
    }

    @PutMapping("/types/{typeId}")
    @Transactional
    public ComplaintDtos.ComplaintTypeDto updateType(@AuthenticationPrincipal CurrentUser user,
                                                     @PathVariable String typeId,
                                                     @RequestBody ComplaintDtos.ComplaintTypeRequest request) {
        UUID schoolId = requireAdminSchool(user);
        ComplaintType type = typeOfSchool(typeId, schoolId);
        if (request.name() != null && !request.name().isBlank()) {
            typeByName(schoolId, request.name().trim())
                    .filter(existing -> !existing.getId().equals(type.getId()))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Loại đơn này đã tồn tại");
                    });
            type.setName(request.name().trim());
        }
        if (request.description() != null) {
            type.setDescription(request.description().isBlank() ? "" : request.description().trim());
        }
        List<String> categories = null;
        if (request.category() != null) {
            categories = ComplaintDtos.normalizeCategories(request.category());
            if (categories.isEmpty()) {
                throw new BadRequestException("Vui lòng chọn ít nhất một loại người dùng (teacher hoặc parent)");
            }
            complaintTypeCategoryRepository.deleteByComplaintTypeId(type.getId());
            saveCategories(type.getId(), categories);
        }
        complaintTypeRepository.save(type);
        return new ComplaintDtos.ComplaintTypeDto(
                type.getId().toString(), type.getName(), type.getDescription(),
                categories != null ? categories
                        : complaintTypeCategoryRepository.findByComplaintTypeId(type.getId()).stream()
                                .map(ComplaintTypeCategory::getCategory).toList());
    }

    @DeleteMapping("/types/{typeId}")
    @Transactional
    public Map<String, String> deleteType(@AuthenticationPrincipal CurrentUser user, @PathVariable String typeId) {
        UUID schoolId = requireAdminSchool(user);
        ComplaintType type = typeOfSchool(typeId, schoolId);
        complaintTypeCategoryRepository.deleteByComplaintTypeId(type.getId());
        complaintTypeRepository.delete(type);
        return Map.of("message", "Xóa loại đơn thành công");
    }

    // ---------- Helpers ----------

    private UUID requireAdminSchool(CurrentUser user) {
        if (user == null || (user.role() != Role.SCHOOL_ADMIN && user.role() != Role.ADMIN)) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        if (user.schoolId() == null) {
            throw new BadRequestException("Không tìm thấy thông tin trường học");
        }
        return UUID.fromString(user.schoolId());
    }

    private Set<UUID> roleIds(UUID schoolId, Role role) {
        return userRepository.findBySchoolIdAndRole(schoolId, role).stream()
                .map(u -> u.getId())
                .collect(Collectors.toSet());
    }

    private ComplaintDtos.StatCounts countsOf(List<Complaint> complaints) {
        return new ComplaintDtos.StatCounts(
                complaints.size(),
                complaints.stream().filter(c -> "pending".equals(c.getStatus())).count(),
                complaints.stream().filter(c -> "approve".equals(c.getStatus())).count(),
                complaints.stream().filter(c -> "reject".equals(c.getStatus())).count());
    }

    private Complaint complaintOfSchool(String complaintId, UUID schoolId, String message) {
        UUID parsed = ComplaintDtos.parseId(complaintId);
        if (parsed == null) {
            throw new NotFoundException(message);
        }
        return complaintRepository.findById(parsed)
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException(message));
    }

    private ComplaintType typeOfSchool(String typeId, UUID schoolId) {
        UUID parsed = ComplaintDtos.parseId(typeId);
        if (parsed == null) {
            throw new NotFoundException("Không tìm thấy loại đơn");
        }
        return complaintTypeRepository.findById(parsed)
                .filter(t -> t.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy loại đơn"));
    }

    private java.util.Optional<ComplaintType> typeByName(UUID schoolId, String name) {
        return complaintTypeRepository.findBySchoolIdOrderByNameAsc(schoolId).stream()
                .filter(t -> t.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    private void saveCategories(UUID typeId, List<String> categories) {
        List<ComplaintTypeCategory> rows = new ArrayList<>();
        for (String category : categories) {
            ComplaintTypeCategory row = new ComplaintTypeCategory();
            row.setComplaintTypeId(typeId);
            row.setCategory(category);
            rows.add(row);
        }
        complaintTypeCategoryRepository.saveAll(rows);
    }
}
