package vn.kidslink.api.school;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.security.CurrentUser;

/** School-admin surface: read and update the caller's own school. */
@RestController
@RequestMapping("/api/school-admin/school")
public class SchoolAdminSchoolController {

    private final SchoolRepository schoolRepository;
    private final SchoolMapper mapper;

    public SchoolAdminSchoolController(SchoolRepository schoolRepository, SchoolMapper mapper) {
        this.schoolRepository = schoolRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public SchoolDtos.SchoolDto get(@AuthenticationPrincipal CurrentUser principal) {
        UUID schoolId = requireSchoolAdmin(principal);
        return mapper.toDto(schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học")));
    }

    @PutMapping
    public SchoolDtos.SchoolDto update(@AuthenticationPrincipal CurrentUser principal,
                                       @RequestBody SchoolDtos.SchoolRequest request) {
        UUID schoolId = requireSchoolAdmin(principal);
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
        // A school admin can edit branding and payment config but not its own activation state.
        Short currentStatus = school.getStatus();
        mapper.apply(school, request);
        school.setStatus(currentStatus);
        schoolRepository.save(school);
        return mapper.toDto(school);
    }

    private UUID requireSchoolAdmin(CurrentUser principal) {
        if (principal == null || principal.role() != Role.SCHOOL_ADMIN || principal.schoolId() == null) {
            throw new ForbiddenException("Chỉ quản trị trường học được thực hiện thao tác này");
        }
        return UUID.fromString(principal.schoolId());
    }
}
