package vn.kidslink.api.complaint;

import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/teachers/complaints")
public class TeacherComplaintController {

    private static final String CATEGORY = "teacher";
    private static final String TYPE_NOT_FOUND = "Loại đơn không tồn tại hoặc không dành cho giáo viên";

    private final ComplaintService complaintService;
    private final UserRepository userRepository;

    public TeacherComplaintController(ComplaintService complaintService, UserRepository userRepository) {
        this.complaintService = complaintService;
        this.userRepository = userRepository;
    }

    @GetMapping("/types")
    public List<ComplaintDtos.ComplaintTypeDto> types(@AuthenticationPrincipal CurrentUser user) {
        return complaintService.typesOfSchool(requireTeacherSchool(user), CATEGORY);
    }

    @PostMapping
    public ResponseEntity<ComplaintDtos.ComplaintDto> create(@AuthenticationPrincipal CurrentUser user,
                                                             @RequestBody ComplaintDtos.CreateComplaintRequest request) {
        User dbUser = requireTeacher(user);
        return ResponseEntity.status(201)
                .body(complaintService.create(dbUser, requireTeacherSchool(user), CATEGORY, request, TYPE_NOT_FOUND));
    }

    @GetMapping
    public List<ComplaintDtos.ComplaintDto> list(@AuthenticationPrincipal CurrentUser user) {
        requireTeacher(user);
        return complaintService.listOwn(UUID.fromString(user.id()));
    }

    @GetMapping("/{complaintId}")
    public ComplaintDtos.ComplaintDetailDto detail(@AuthenticationPrincipal CurrentUser user,
                                                   @PathVariable String complaintId) {
        User dbUser = requireTeacher(user);
        UUID parsed = ComplaintDtos.parseId(complaintId);
        if (parsed == null) {
            throw new NotFoundException("Không tìm thấy đơn");
        }
        return complaintService.detail(parsed, dbUser);
    }

    private User requireTeacher(CurrentUser user) {
        if (user == null || user.role() != Role.TEACHER) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        return userRepository.findById(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private UUID requireTeacherSchool(CurrentUser user) {
        requireTeacher(user);
        if (user.schoolId() == null) {
            throw new ForbiddenException("Không tìm thấy thông tin trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
