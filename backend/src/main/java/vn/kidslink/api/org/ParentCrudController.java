package vn.kidslink.api.org;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.*;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.*;
import vn.kidslink.domain.repository.*;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/parentcrud")
public class ParentCrudController {

    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;

    public ParentCrudController(ParentRepository parentRepository,
                                ParentStudentRepository parentStudentRepository,
                                StudentRepository studentRepository,
                                UserRepository userRepository,
                                SchoolRepository schoolRepository,
                                PasswordEncoder passwordEncoder) {
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- DTOs / requests ----------

    public record ChildDto(String id, String fullName, String relationship) {
    }

    public record ParentCrudDto(
            String id,
            String userId,
            UserDto user,
            List<ChildDto> children) {

        public static ParentCrudDto from(Parent parent, List<ParentStudent> links) {
            return new ParentCrudDto(
                    parent.getId().toString(),
                    parent.getUser().getId().toString(),
                    UserDto.from(parent.getUser()),
                    links.stream()
                            .map(l -> new ChildDto(
                                    l.getStudent().getId().toString(),
                                    l.getStudent().getFullName(),
                                    l.getRelationship()))
                            .toList());
        }
    }

    public record CreateRequest(
            String fullName, String phoneNumber, String email, String address,
            String username, String password) {
    }

    public record LinkRequest(String parentId, String studentId, String relationship) {
    }

    public record UpdateRequest(
            String fullName, String phoneNumber, String email, String address,
            String studentId, String relationship) {
    }

    // ---------- Endpoints ----------

    @GetMapping
    public List<ParentCrudDto> all(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return parentRepository.findByUserSchoolId(schoolId).stream()
                .map(p -> ParentCrudDto.from(p, parentStudentRepository.findByParentId(p.getId())))
                .toList();
    }

    @PostMapping
    public ResponseEntity<ParentCrudDto> create(@AuthenticationPrincipal CurrentUser user,
                                                @RequestBody CreateRequest request) {
        UUID schoolId = requireSchool(user);
        if (request.fullName() == null || request.fullName().isBlank()) {
            throw new BadRequestException("Thiếu full_name");
        }
        if (request.phoneNumber() != null && userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new ConflictException("Số điện thoại đã tồn tại");
        }
        if (request.email() != null && userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email đã tồn tại");
        }

        User userEntity = new User();
        userEntity.setFullName(request.fullName());
        userEntity.setRole(Role.PARENT);
        userEntity.setStatus((short) 1);
        userEntity.setEmail(request.email());
        userEntity.setPhoneNumber(request.phoneNumber());
        userEntity.setAddress(request.address());
        userEntity.setSchool(schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học")));
        if (request.username() != null && !request.username().isBlank()) {
            if (userRepository.existsByUsername(request.username())) {
                throw new ConflictException("Tên đăng nhập đã tồn tại");
            }
            userEntity.setUsername(request.username());
            userEntity.setPasswordHash(passwordEncoder.encode(request.password()));
        } else if (request.password() != null) {
            // auto username from phone/email, random password not needed when password given
            userEntity.setUsername(uniqueUsername(request.phoneNumber(), request.email()));
            userEntity.setPasswordHash(passwordEncoder.encode(request.password()));
        } else {
            userEntity.setUsername(uniqueUsername(request.phoneNumber(), request.email()));
            userEntity.setPasswordHash(passwordEncoder.encode(randomPassword()));
        }
        userRepository.save(userEntity);

        Parent parent = new Parent();
        parent.setUser(userEntity);
        parentRepository.save(parent);
        return ResponseEntity.status(201).body(ParentCrudDto.from(parent, List.of()));
    }

    @PostMapping("/link")
    public ResponseEntity<Map<String, String>> link(@AuthenticationPrincipal CurrentUser user,
                                                     @RequestBody LinkRequest request) {
        UUID schoolId = requireSchool(user);
        if (request.parentId() == null || request.studentId() == null
                || request.relationship() == null || request.relationship().isBlank()) {
            throw new BadRequestException("Thiếu parent_id, student_id hoặc relationship");
        }
        Parent parent = findByIdAndSchool(request.parentId(), schoolId);
        Student student = studentRepository.findById(UUID.fromString(request.studentId()))
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));

        if (parentStudentRepository.findByParentIdAndStudentId(parent.getId(), student.getId()).isPresent()) {
            throw new ConflictException("Phụ huynh này đã được liên kết với học sinh");
        }
        checkSingleFatherMother(student.getId(), request.relationship());

        ParentStudent ps = new ParentStudent();
        ps.setParent(parent);
        ps.setStudent(student);
        ps.setRelationship(request.relationship());
        parentStudentRepository.save(ps);
        return ResponseEntity.status(201).body(Map.of("message", "Liên kết phụ huynh thành công"));
    }

    @PutMapping("/{id}")
    public ParentCrudDto update(@AuthenticationPrincipal CurrentUser user,
                                @PathVariable String id,
                                @RequestBody UpdateRequest request) {
        UUID schoolId = requireSchool(user);
        Parent parent = findByIdAndSchool(id, schoolId);
        User userEntity = parent.getUser();

        if (request.fullName() != null) userEntity.setFullName(request.fullName());
        if (request.phoneNumber() != null) userEntity.setPhoneNumber(request.phoneNumber());
        if (request.email() != null) userEntity.setEmail(request.email());
        if (request.address() != null) userEntity.setAddress(request.address());
        userRepository.save(userEntity);

        if (request.studentId() != null && request.relationship() != null) {
            Student student = studentRepository.findById(UUID.fromString(request.studentId()))
                    .filter(s -> s.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));
            ParentStudent link = parentStudentRepository
                    .findByParentIdAndStudentId(parent.getId(), student.getId())
                    .orElseGet(() -> {
                        ParentStudent ps = new ParentStudent();
                        ps.setParent(parent);
                        ps.setStudent(student);
                        return ps;
                    });
            checkSingleFatherMother(student.getId(), request.relationship());
            link.setRelationship(request.relationship());
            parentStudentRepository.save(link);
        }
        return ParentCrudDto.from(parent, parentStudentRepository.findByParentId(parent.getId()));
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser user,
                                      @PathVariable String id,
                                      @RequestParam String studentId) {
        UUID schoolId = requireSchool(user);
        Parent parent = findByIdAndSchool(id, schoolId);
        Student student = studentRepository.findById(UUID.fromString(studentId))
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));

        parentStudentRepository.findByParentIdAndStudentId(parent.getId(), student.getId())
                .ifPresent(parentStudentRepository::delete);

        if (parentStudentRepository.findByParentId(parent.getId()).isEmpty()) {
            // orphan parent: remove parent and its user, matching legacy behavior
            parentRepository.delete(parent);
            userRepository.delete(parent.getUser());
        }
        return Map.of("message", "Đã xoá liên kết phụ huynh với học sinh");
    }

    // ---------- Helpers ----------

    private Parent findByIdAndSchool(String id, UUID schoolId) {
        return parentRepository.findById(UUID.fromString(id))
                .filter(p -> p.getUser().getSchool() != null
                        && p.getUser().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phụ huynh"));
    }

    private void checkSingleFatherMother(UUID studentId, String relationship) {
        if (!"father".equals(relationship) && !"mother".equals(relationship)) {
            return;
        }
        if (parentStudentRepository.findByStudentId(studentId).stream()
                .anyMatch(l -> relationship.equals(l.getRelationship()))) {
            throw new ConflictException("Học sinh này đã có "
                    + ("father".equals(relationship) ? "bố" : "mẹ"));
        }
    }

    private String uniqueUsername(String phone, String email) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        String base = !digits.isEmpty() ? "ph" + digits.substring(Math.max(0, digits.length() - 9))
                : email != null ? email.split("@")[0].replaceAll("[^a-z0-9._-]", "")
                : "parent" + System.currentTimeMillis();
        String username = base;
        int suffix = 0;
        while (userRepository.existsByUsername(username)) {
            suffix++;
            username = base + suffix;
        }
        return username;
    }

    private String randomPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
