package vn.kidslink.api.org;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ConflictException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.*;
import vn.kidslink.domain.repository.*;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/classes")
public class ClassController {

    private final ClassRepository classRepository;
    private final ClassAgeRepository classAgeRepository;
    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;

    public ClassController(ClassRepository classRepository,
                           ClassAgeRepository classAgeRepository,
                           StudentRepository studentRepository,
                           StudentClassRepository studentClassRepository,
                           TeacherRepository teacherRepository,
                           SchoolRepository schoolRepository) {
        this.classRepository = classRepository;
        this.classAgeRepository = classAgeRepository;
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.teacherRepository = teacherRepository;
        this.schoolRepository = schoolRepository;
    }

    // ---------- DTOs ----------

    public record ClassDto(
            String id, String className, String academicYear, String schoolId,
            String classAgeId, String teacherId, String coTeacherId,
            LocalDate startDate, LocalDate endDate,
            ClassAgeController.ClassAgeDto classAge,
            TeacherSummary teacher, TeacherSummary coTeacher,
            Long studentCount) {

        public static ClassDto from(ClassEntity entity, Long studentCount) {
            return new ClassDto(
                    entity.getId().toString(),
                    entity.getClassName(),
                    entity.getAcademicYear(),
                    entity.getSchool().getId().toString(),
                    entity.getClassAge().getId().toString(),
                    entity.getTeacher() == null ? null : entity.getTeacher().getId().toString(),
                    entity.getCoTeacher() == null ? null : entity.getCoTeacher().getId().toString(),
                    entity.getStartDate(), entity.getEndDate(),
                    ClassAgeController.ClassAgeDto.from(entity.getClassAge()),
                    TeacherSummary.from(entity.getTeacher()),
                    TeacherSummary.from(entity.getCoTeacher()),
                    studentCount);
        }
    }

    public record TeacherSummary(String id, String userId, UserDto.Summary user) {
        public static TeacherSummary from(Teacher teacher) {
            if (teacher == null) return null;
            return new TeacherSummary(
                    teacher.getId().toString(),
                    teacher.getUser().getId().toString(),
                    UserDto.Summary.from(teacher.getUser()));
        }
    }

    public record CreateRequest(
            String className, String academicYear, String classAgeId,
            String teacherId, String coTeacherId,
            LocalDate startDate, LocalDate endDate) {
    }

    public record AddStudentsRequest(List<String> studentIds, BigDecimal discount) {
    }

    public record TransferRequest(String classId, BigDecimal discount) {
    }

    // ---------- Endpoints ----------

    @GetMapping
    public List<ClassDto> list(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        List<ClassEntity> classes = user.role() == Role.TEACHER
                ? classRepository.findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(
                        teacherIdOf(user), teacherIdOf(user))
                : classRepository.findBySchoolIdOrderByClassNameAsc(schoolId);
        return classes.stream().map(entity -> ClassDto.from(entity,
                (long) studentClassRepository.findByClassEntityId(entity.getId()).size())).toList();
    }

    @GetMapping("/{id}")
    public ClassDto get(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        ClassEntity entity = findByIdAndSchool(id, schoolId);
        return ClassDto.from(entity,
                (long) studentClassRepository.findByClassEntityId(entity.getId()).size());
    }

    @PostMapping
    public ResponseEntity<ClassDto> create(@AuthenticationPrincipal CurrentUser user,
                                           @RequestBody CreateRequest request) {
        UUID schoolId = requireSchool(user);
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));

        // Check duplicate class name in same academic year
        classRepository.findBySchoolIdOrderByClassNameAsc(schoolId).stream()
                .filter(c -> c.getClassName().equals(request.className())
                        && c.getAcademicYear().equals(request.academicYear()))
                .findFirst()
                .ifPresent(c -> {
                    throw new ConflictException(
                            "Đã tồn tại lớp \"" + request.className() + "\" trong năm học " + request.academicYear());
                });

        ClassAge classAge = classAgeRepository.findById(UUID.fromString(request.classAgeId()))
                .filter(ca -> ca.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi"));

        Teacher teacher = request.teacherId() == null || request.teacherId().isBlank()
                ? null
                : teacherRepository.findById(UUID.fromString(request.teacherId()))
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên chính"));

        Teacher coTeacher = request.coTeacherId() == null || request.coTeacherId().isBlank()
                ? null
                : teacherRepository.findById(UUID.fromString(request.coTeacherId()))
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên phụ"));

        ClassEntity entity = new ClassEntity();
        entity.setClassName(request.className());
        entity.setAcademicYear(request.academicYear());
        entity.setSchool(school);
        entity.setClassAge(classAge);
        entity.setTeacher(teacher);
        entity.setCoTeacher(coTeacher);
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        classRepository.save(entity);

        return ResponseEntity.status(201).body(ClassDto.from(entity, 0L));
    }

    @PutMapping("/{id}")
    public ClassDto update(@AuthenticationPrincipal CurrentUser user,
                           @PathVariable String id,
                           @RequestBody CreateRequest request) {
        UUID schoolId = requireSchool(user);
        ClassEntity entity = findByIdAndSchool(id, schoolId);

        if (request.className() != null) entity.setClassName(request.className());
        if (request.academicYear() != null) entity.setAcademicYear(request.academicYear());
        if (request.startDate() != null) entity.setStartDate(request.startDate());
        if (request.endDate() != null) entity.setEndDate(request.endDate());
        if (request.classAgeId() != null) {
            ClassAge classAge = classAgeRepository.findById(UUID.fromString(request.classAgeId()))
                    .filter(ca -> ca.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi"));
            entity.setClassAge(classAge);
        }
        if (request.teacherId() != null) {
            entity.setTeacher(request.teacherId().isBlank() ? null
                    : teacherRepository.findById(UUID.fromString(request.teacherId()))
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên")));
        }
        if (request.coTeacherId() != null) {
            entity.setCoTeacher(request.coTeacherId().isBlank() ? null
                    : teacherRepository.findById(UUID.fromString(request.coTeacherId()))
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên")));
        }

        classRepository.save(entity);
        return ClassDto.from(entity, (long) studentClassRepository.findByClassEntityId(entity.getId()).size());
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        ClassEntity entity = findByIdAndSchool(id, schoolId);
        studentClassRepository.findByClassEntityId(entity.getId()).forEach(studentClassRepository::delete);
        classRepository.delete(entity);
        return Map.of("message", "Đã xoá lớp học");
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ClassDto> promote(@AuthenticationPrincipal CurrentUser user,
                                            @PathVariable String id,
                                            @RequestBody CreateRequest request) {
        UUID schoolId = requireSchool(user);
        ClassEntity old = findByIdAndSchool(id, schoolId);

        // Create new class with new class_age / academic year, copy students
        ClassEntity newClass = new ClassEntity();
        newClass.setClassName(request.className() != null ? request.className() : old.getClassName());
        newClass.setAcademicYear(request.academicYear());
        newClass.setSchool(old.getSchool());
        newClass.setClassAge(classAgeRepository.findById(UUID.fromString(request.classAgeId()))
                .filter(ca -> ca.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi")));
        newClass.setTeacher(old.getTeacher());
        newClass.setCoTeacher(old.getCoTeacher());
        newClass.setStartDate(request.startDate());
        newClass.setEndDate(request.endDate());
        classRepository.save(newClass);

        // Copy students
        studentClassRepository.findByClassEntityId(old.getId()).forEach(sc -> {
            StudentClass copy = new StudentClass();
            copy.setStudent(sc.getStudent());
            copy.setClassEntity(newClass);
            copy.setDiscount(sc.getDiscount());
            studentClassRepository.save(copy);
        });

        return ResponseEntity.status(201).body(ClassDto.from(newClass,
                (long) studentClassRepository.findByClassEntityId(newClass.getId()).size()));
    }

    @GetMapping("/{classId}/eligible-students")
    public List<StudentDto> eligibleStudents(@AuthenticationPrincipal CurrentUser user, @PathVariable String classId) {
        UUID schoolId = requireSchool(user);
        ClassEntity cls = findByIdAndSchool(classId, schoolId);
        Set<UUID> assigned = new HashSet<>();
        studentClassRepository.findByClassEntityId(cls.getId())
                .forEach(sc -> assigned.add(sc.getStudent().getId()));
        return studentRepository.findBySchoolIdOrderByFullNameAsc(schoolId).stream()
                .filter(s -> !assigned.contains(s.getId()))
                .map(StudentDto::from).toList();
    }

    @PostMapping("/{classId}/students")
    public ResponseEntity<List<StudentClassDto>> addStudents(@AuthenticationPrincipal CurrentUser user,
                                                              @PathVariable String classId,
                                                              @RequestBody AddStudentsRequest request) {
        UUID schoolId = requireSchool(user);
        ClassEntity cls = findByIdAndSchool(classId, schoolId);
        BigDecimal discount = request.discount() == null ? BigDecimal.ZERO : request.discount();

        List<StudentClassDto> result = new ArrayList<>();
        for (String studentId : request.studentIds()) {
            Student student = studentRepository.findById(UUID.fromString(studentId))
                    .filter(s -> s.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));

            if (studentClassRepository.existsByStudentIdAndClassEntityId(student.getId(), cls.getId())) {
                continue; // Already in class, skip
            }

            StudentClass sc = new StudentClass();
            sc.setStudent(student);
            sc.setClassEntity(cls);
            sc.setDiscount(discount);
            studentClassRepository.save(sc);
            result.add(StudentClassDto.from(sc));
        }

        return ResponseEntity.status(201).body(result);
    }

    @DeleteMapping("/{classId}/students/{studentId}")
    public Map<String, String> removeStudent(@AuthenticationPrincipal CurrentUser user,
                                              @PathVariable String classId,
                                              @PathVariable String studentId) {
        UUID schoolId = requireSchool(user);
        ClassEntity cls = findByIdAndSchool(classId, schoolId);
        studentClassRepository.findByStudentIdAndClassEntityId(UUID.fromString(studentId), cls.getId())
                .ifPresent(studentClassRepository::delete);
        return Map.of("message", "Đã xoá học sinh khỏi lớp");
    }

    // ---------- Helpers ----------

    private ClassEntity findByIdAndSchool(String id, UUID schoolId) {
        return classRepository.findById(UUID.fromString(id))
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }

    private UUID teacherIdOf(CurrentUser user) {
        return teacherRepository.findByUserId(UUID.fromString(user.id()))
                .map(Teacher::getId)
                .orElseThrow(() -> new ForbiddenException("Tài khoản không phải giáo viên"));
    }

    public record StudentClassDto(String id, String studentId, String classId, BigDecimal discount) {
        public static StudentClassDto from(StudentClass sc) {
            return new StudentClassDto(
                    sc.getId().toString(),
                    sc.getStudent().getId().toString(),
                    sc.getClassEntity().getId().toString(),
                    sc.getDiscount());
        }
    }
}
