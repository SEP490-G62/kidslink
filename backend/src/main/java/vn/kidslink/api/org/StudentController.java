package vn.kidslink.api.org;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.*;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.*;
import vn.kidslink.domain.repository.*;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/student")
public class StudentController {

    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final ClassRepository classRepository;
    private final SchoolRepository schoolRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final UserRepository userRepository;

    public StudentController(StudentRepository studentRepository,
                             StudentClassRepository studentClassRepository,
                             ClassRepository classRepository,
                             SchoolRepository schoolRepository,
                             ParentRepository parentRepository,
                             ParentStudentRepository parentStudentRepository,
                             UserRepository userRepository) {
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.classRepository = classRepository;
        this.schoolRepository = schoolRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.userRepository = userRepository;
    }

    // ---------- Requests ----------

    public record SaveRequest(
            String fullName, LocalDate dob, Short gender, String avatarUrl,
            String allergy, String classId, Short status) {
    }

    public record TransferRequest(String classId, BigDecimal discount) {
    }

    public record StatusRequest(Short status) {
    }

    public record ParentLinkRequest(String parentId, String relationship) {
    }

    // ---------- Endpoints ----------

    @GetMapping("/all")
    public List<StudentDto> all(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return studentRepository.findBySchoolIdOrderByFullNameAsc(schoolId).stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/class/{classId}")
    public List<StudentDto> byClass(@AuthenticationPrincipal CurrentUser user, @PathVariable String classId) {
        UUID schoolId = requireSchool(user);
        ClassEntity cls = findClass(classId, schoolId);
        return studentClassRepository.findByClassEntityId(cls.getId()).stream()
                .map(sc -> toDto(sc.getStudent(), sc))
                .toList();
    }

    @GetMapping("/{id}")
    public StudentDto get(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        return toDto(findByIdAndSchool(id, schoolId));
    }

    @PostMapping
    public ResponseEntity<StudentDto> create(@AuthenticationPrincipal CurrentUser user,
                                             @RequestBody SaveRequest request) {
        UUID schoolId = requireSchool(user);
        if (request.fullName() == null || request.fullName().isBlank()
                || request.dob() == null) {
            throw new BadRequestException("Thiếu thông tin bắt buộc: full_name, date_of_birth");
        }
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));

        Student student = new Student();
        student.setFullName(request.fullName());
        student.setDob(request.dob());
        student.setGender(request.gender() == null ? 0 : request.gender());
        student.setAvatarUrl(request.avatarUrl() == null ? "" : request.avatarUrl());
        student.setAllergy(request.allergy() == null ? "" : request.allergy());
        student.setStatus((short) 1);
        student.setSchool(school);
        studentRepository.save(student);

        StudentClass sc = null;
        if (request.classId() != null && !request.classId().isBlank()) {
            sc = assignClass(student, request.classId(), schoolId, BigDecimal.ZERO);
        }
        return ResponseEntity.status(201).body(toDto(student, sc));
    }

    @PutMapping("/{id}")
    public StudentDto update(@AuthenticationPrincipal CurrentUser user,
                             @PathVariable String id,
                             @RequestBody SaveRequest request) {
        UUID schoolId = requireSchool(user);
        Student student = findByIdAndSchool(id, schoolId);

        if (request.fullName() != null) student.setFullName(request.fullName());
        if (request.dob() != null) student.setDob(request.dob());
        if (request.gender() != null) student.setGender(request.gender());
        if (request.avatarUrl() != null) student.setAvatarUrl(request.avatarUrl());
        if (request.allergy() != null) student.setAllergy(request.allergy());
        if (request.status() != null) student.setStatus(request.status());
        studentRepository.save(student);

        StudentClass sc = null;
        if (request.classId() != null && !request.classId().isBlank()) {
            studentClassRepository.findByStudentId(student.getId())
                    .forEach(studentClassRepository::delete);
            sc = assignClass(student, request.classId(), schoolId, BigDecimal.ZERO);
        }
        return toDto(student, sc);
    }

    @PostMapping("/{id}/transfer")
    public Map<String, String> transfer(@AuthenticationPrincipal CurrentUser user,
                                       @PathVariable String id,
                                       @RequestBody TransferRequest request) {
        UUID schoolId = requireSchool(user);
        Student student = findByIdAndSchool(id, schoolId);
        if (request.classId() == null || request.classId().isBlank()) {
            throw new BadRequestException("Thiếu class_id");
        }
        studentClassRepository.findByStudentId(student.getId())
                .forEach(studentClassRepository::delete);
        assignClass(student, request.classId(), schoolId,
                request.discount() == null ? BigDecimal.ZERO : request.discount());
        return Map.of("message", "Chuyển lớp thành công");
    }

    @PatchMapping("/{id}/status")
    public StudentDto updateStatus(@AuthenticationPrincipal CurrentUser user,
                                   @PathVariable String id,
                                   @RequestBody StatusRequest request) {
        UUID schoolId = requireSchool(user);
        if (request.status() == null || (request.status() != 0 && request.status() != 1)) {
            throw new BadRequestException("status phải là 0 hoặc 1");
        }
        Student student = findByIdAndSchool(id, schoolId);
        student.setStatus(request.status());
        studentRepository.save(student);
        return toDto(student);
    }

    @PostMapping("/{id}/parents")
    public ResponseEntity<StudentDto.ParentDto> addParent(@AuthenticationPrincipal CurrentUser user,
                                                          @PathVariable String id,
                                                          @RequestBody ParentLinkRequest request) {
        UUID schoolId = requireSchool(user);
        Student student = findByIdAndSchool(id, schoolId);
        if (request.parentId() == null || request.relationship() == null || request.relationship().isBlank()) {
            throw new BadRequestException("Thiếu parent_id hoặc relationship");
        }
        Parent parent = parentRepository.findById(UUID.fromString(request.parentId()))
                .filter(p -> p.getUser().getSchool() == null
                        || p.getUser().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phụ huynh"));

        checkSingleFatherMother(student.getId(), request.relationship(), null);

        ParentStudent link = parentStudentRepository
                .findByParentIdAndStudentId(parent.getId(), student.getId())
                .orElseGet(ParentStudent::new);
        link.setParent(parent);
        link.setStudent(student);
        link.setRelationship(request.relationship());
        parentStudentRepository.save(link);

        return ResponseEntity.status(201)
                .body(StudentDto.ParentDto.from(parent, request.relationship()));
    }

    @DeleteMapping("/{id}/parents/{parentId}")
    public Map<String, String> removeParent(@AuthenticationPrincipal CurrentUser user,
                                            @PathVariable String id,
                                            @PathVariable String parentId) {
        UUID schoolId = requireSchool(user);
        Student student = findByIdAndSchool(id, schoolId);
        ParentStudent link = parentStudentRepository
                .findByParentIdAndStudentId(UUID.fromString(parentId), student.getId())
                .orElseThrow(() -> new NotFoundException("Phụ huynh không được gán cho học sinh này"));
        parentStudentRepository.delete(link);

        if (parentStudentRepository.findByParentId(link.getParent().getId()).isEmpty()) {
            parentRepository.delete(link.getParent());
            userRepository.delete(link.getParent().getUser());
        }
        return Map.of("message", "Đã xoá phụ huynh khỏi học sinh");
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        Student student = findByIdAndSchool(id, schoolId);
        student.setStatus((short) 0); // soft delete, matching legacy behavior
        studentRepository.save(student);
        return Map.of("message", "Đã vô hiệu hoá học sinh");
    }

    // ---------- Helpers ----------


    private Student findByIdAndSchool(String id, UUID schoolId) {
        return studentRepository.findById(UUID.fromString(id))
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));
    }

    private ClassEntity findClass(String classId, UUID schoolId) {
        return classRepository.findById(UUID.fromString(classId))
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
    }

    private StudentClass assignClass(Student student, String classId, UUID schoolId, BigDecimal discount) {
        ClassEntity cls = findClass(classId, schoolId);
        if (studentClassRepository.existsByStudentIdAndClassEntityId(student.getId(), cls.getId())) {
            throw new ConflictException("Học sinh đã có trong lớp này");
        }
        StudentClass sc = new StudentClass();
        sc.setStudent(student);
        sc.setClassEntity(cls);
        sc.setDiscount(discount);
        return studentClassRepository.save(sc);
    }

    private void checkSingleFatherMother(UUID studentId, String relationship, UUID excludeParentId) {
        if (!"father".equals(relationship) && !"mother".equals(relationship)) {
            return;
        }
        parentStudentRepository.findByStudentId(studentId).stream()
                .filter(l -> relationship.equals(l.getRelationship()))
                .filter(l -> excludeParentId == null || !l.getParent().getId().equals(excludeParentId))
                .findFirst()
                .ifPresent(l -> {
                    throw new ConflictException("Học sinh này đã có "
                            + ("father".equals(relationship) ? "bố" : "mẹ"));
                });
    }

    private StudentDto toDto(Student student) {
        StudentClass sc = studentClassRepository.findByStudentId(student.getId()).stream()
                .findFirst().orElse(null);
        return toDto(student, sc);
    }

    private StudentDto toDto(Student student, StudentClass sc) {
        List<StudentDto.ParentDto> parents = parentStudentRepository
                .findByStudentId(student.getId()).stream()
                .map(l -> StudentDto.ParentDto.from(l.getParent(), l.getRelationship()))
                .toList();
        return StudentDto.from(student, sc, parents);
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
