package vn.kidslink.api.health;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.HealthCareStaff;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.HealthCareStaffRepository;
import vn.kidslink.domain.repository.HealthNoticeRepository;
import vn.kidslink.domain.repository.HealthRecordRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.StudentRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/health-staff")
public class HealthStaffController {

    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final HealthNoticeRepository healthNoticeRepository;
    private final HealthCareStaffRepository healthCareStaffRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HealthStaffController(ClassRepository classRepository,
                                 StudentRepository studentRepository,
                                 StudentClassRepository studentClassRepository,
                                 HealthRecordRepository healthRecordRepository,
                                 HealthNoticeRepository healthNoticeRepository,
                                 HealthCareStaffRepository healthCareStaffRepository,
                                 UserRepository userRepository,
                                 PasswordEncoder passwordEncoder) {
        this.classRepository = classRepository;
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.healthNoticeRepository = healthNoticeRepository;
        this.healthCareStaffRepository = healthCareStaffRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- Classes & students ----------

    @GetMapping("/classes")
    public List<HealthDtos.HealthClassDto> listClasses(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireStaff(user);
        return classRepository.findBySchoolIdOrderByClassNameAsc(schoolId).stream()
                .sorted(Comparator.comparing((vn.kidslink.domain.entity.ClassEntity c) -> c.getAcademicYear()).reversed()
                        .thenComparing(c -> c.getClassName()))
                .map(HealthDtos.HealthClassDto::from)
                .toList();
    }

    @GetMapping("/classes/{classId}/students")
    public List<HealthDtos.HealthStudentDto> listStudentsByClass(@AuthenticationPrincipal CurrentUser user,
                                                                 @PathVariable String classId) {
        UUID schoolId = requireStaff(user);
        var cls = classRepository.findById(UUID.fromString(classId))
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
        return studentClassRepository.findByClassEntityId(cls.getId()).stream()
                .filter(sc -> sc.getStudent() != null && sc.getStudent().getSchool() != null
                        && sc.getStudent().getSchool().getId().equals(schoolId))
                .map(HealthDtos.HealthStudentDto::from)
                .toList();
    }

    // ---------- Health records ----------

    @GetMapping("/health/records")
    public List<HealthDtos.HealthRecordDto> listRecords(@AuthenticationPrincipal CurrentUser user,
                                                        @RequestParam(required = false) String studentId) {
        UUID schoolId = requireStaff(user);
        Stream<vn.kidslink.domain.entity.HealthRecord> records;
        if (studentId == null || studentId.isBlank()) {
            records = healthRecordRepository.findByStudent_IdInOrderByCheckupDateDesc(studentIdsOfSchool(schoolId)).stream();
        } else {
            requireStudentOfSchool(studentId, schoolId);
            records = healthRecordRepository.findByStudentIdOrderByCheckupDateDesc(UUID.fromString(studentId)).stream();
        }
        return records.map(HealthDtos.HealthRecordDto::from).toList();
    }

    @PostMapping("/health/records")
    public ResponseEntity<HealthDtos.HealthRecordDto> createRecord(@AuthenticationPrincipal CurrentUser user,
                                                                    @RequestBody HealthDtos.HealthRecordRequest request) {
        UUID schoolId = requireStaff(user);
        if (request.checkupDate() == null || request.heightCm() == null || request.weightKg() == null
                || request.note() == null || request.note().isBlank() || isBlank(request.studentId())) {
            throw new BadRequestException("Thiếu trường dữ liệu");
        }
        Student student = requireStudentOfSchool(request.studentId(), schoolId);
        HealthCareStaff staff = requireStaffProfile(user);

        var record = new vn.kidslink.domain.entity.HealthRecord();
        record.setCheckupDate(request.checkupDate());
        record.setHeightCm(request.heightCm());
        record.setWeightKg(request.weightKg());
        record.setNote(request.note());
        record.setStudent(student);
        record.setHealthCareStaff(staff);
        healthRecordRepository.save(record);
        return ResponseEntity.status(201).body(HealthDtos.HealthRecordDto.from(record));
    }

    @PutMapping("/health/records/{recordId}")
    public HealthDtos.HealthRecordDto updateRecord(@AuthenticationPrincipal CurrentUser user,
                                                    @PathVariable String recordId,
                                                    @RequestBody HealthDtos.HealthRecordRequest request) {
        UUID schoolId = requireStaff(user);
        var record = healthRecordRepository.findById(UUID.fromString(recordId))
                .filter(r -> r.getStudent().getSchool() != null
                        && r.getStudent().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sổ sức khoẻ"));
        if (request.checkupDate() != null) record.setCheckupDate(request.checkupDate());
        if (request.heightCm() != null) record.setHeightCm(request.heightCm());
        if (request.weightKg() != null) record.setWeightKg(request.weightKg());
        if (request.note() != null) record.setNote(request.note());
        healthRecordRepository.save(record);
        return HealthDtos.HealthRecordDto.from(record);
    }

    @DeleteMapping("/health/records/{recordId}")
    public java.util.Map<String, String> deleteRecord(@AuthenticationPrincipal CurrentUser user,
                                                       @PathVariable String recordId) {
        UUID schoolId = requireStaff(user);
        var record = healthRecordRepository.findById(UUID.fromString(recordId))
                .filter(r -> r.getStudent().getSchool() != null
                        && r.getStudent().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy record để xóa"));
        healthRecordRepository.delete(record);
        return java.util.Map.of("message", "Đã xóa sổ sức khoẻ thành công");
    }

    // ---------- Health notices ----------

    @GetMapping("/health/notices")
    public List<HealthDtos.HealthNoticeDto> listNotices(@AuthenticationPrincipal CurrentUser user,
                                                        @RequestParam(required = false) String studentId) {
        UUID schoolId = requireStaff(user);
        Stream<vn.kidslink.domain.entity.HealthNotice> notices;
        if (studentId == null || studentId.isBlank()) {
            notices = healthNoticeRepository.findByStudent_IdInOrderByCreatedAtDesc(studentIdsOfSchool(schoolId)).stream();
        } else {
            requireStudentOfSchool(studentId, schoolId);
            notices = healthNoticeRepository.findByStudentIdOrderByCreatedAtDesc(UUID.fromString(studentId)).stream();
        }
        return notices.map(HealthDtos.HealthNoticeDto::from).toList();
    }

    @PostMapping("/health/notices")
    public ResponseEntity<HealthDtos.HealthNoticeDto> createNotice(@AuthenticationPrincipal CurrentUser user,
                                                                    @RequestBody HealthDtos.HealthNoticeRequest request) {
        UUID schoolId = requireStaff(user);
        if (isBlank(request.studentId()) || isBlank(request.symptoms()) || isBlank(request.actionsTaken())
                || isBlank(request.medications()) || isBlank(request.noticeTime()) || isBlank(request.note())) {
            throw new BadRequestException("Thiếu trường dữ liệu");
        }
        Student student = requireStudentOfSchool(request.studentId(), schoolId);
        HealthCareStaff staff = requireStaffProfile(user);

        var notice = new vn.kidslink.domain.entity.HealthNotice();
        notice.setStudent(student);
        notice.setSymptoms(request.symptoms());
        notice.setActionsTaken(request.actionsTaken());
        notice.setMedications(request.medications());
        notice.setNoticeTime(request.noticeTime());
        notice.setNote(request.note());
        notice.setHealthCareStaff(staff);
        healthNoticeRepository.save(notice);
        return ResponseEntity.status(201).body(HealthDtos.HealthNoticeDto.from(notice));
    }

    @PutMapping("/health/notices/{noticeId}")
    public HealthDtos.HealthNoticeDto updateNotice(@AuthenticationPrincipal CurrentUser user,
                                                    @PathVariable String noticeId,
                                                    @RequestBody HealthDtos.HealthNoticeRequest request) {
        UUID schoolId = requireStaff(user);
        var notice = healthNoticeRepository.findById(UUID.fromString(noticeId))
                .filter(n -> n.getStudent().getSchool() != null
                        && n.getStudent().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy notice"));
        if (!isBlank(request.symptoms())) notice.setSymptoms(request.symptoms());
        if (!isBlank(request.actionsTaken())) notice.setActionsTaken(request.actionsTaken());
        if (!isBlank(request.medications())) notice.setMedications(request.medications());
        if (!isBlank(request.noticeTime())) notice.setNoticeTime(request.noticeTime());
        if (!isBlank(request.note())) notice.setNote(request.note());
        healthNoticeRepository.save(notice);
        return HealthDtos.HealthNoticeDto.from(notice);
    }

    @DeleteMapping("/health/notices/{noticeId}")
    public java.util.Map<String, String> deleteNotice(@AuthenticationPrincipal CurrentUser user,
                                                      @PathVariable String noticeId) {
        UUID schoolId = requireStaff(user);
        var notice = healthNoticeRepository.findById(UUID.fromString(noticeId))
                .filter(n -> n.getStudent().getSchool() != null
                        && n.getStudent().getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy notice để xóa"));
        healthNoticeRepository.delete(notice);
        return java.util.Map.of("message", "Đã xóa thông báo y tế thành công");
    }

    // ---------- Profile ----------

    @GetMapping("/profile")
    public HealthDtos.StaffProfileResponse getProfile(@AuthenticationPrincipal CurrentUser user) {
        User dbUser = requireUser(user);
        HealthCareStaff staff = healthCareStaffRepository.findByUserId(dbUser.getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy health care staff"));
        return new HealthDtos.StaffProfileResponse(UserDto.from(dbUser), HealthDtos.StaffProfileDto.from(staff));
    }

    @PutMapping("/profile")
    public HealthDtos.StaffProfileResponse updateProfile(@AuthenticationPrincipal CurrentUser user,
                                                          @RequestBody HealthDtos.StaffProfileRequest request) {
        User dbUser = requireUser(user);
        if (!isBlank(request.fullName())) dbUser.setFullName(request.fullName().trim());
        if (request.avatarUrl() != null) dbUser.setAvatarUrl(request.avatarUrl());
        if (!isBlank(request.email())) dbUser.setEmail(request.email().trim());
        if (!isBlank(request.phoneNumber())) dbUser.setPhoneNumber(request.phoneNumber().trim());
        userRepository.save(dbUser);

        HealthCareStaff staff = healthCareStaffRepository.findByUserId(dbUser.getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy health care staff"));
        if (!isBlank(request.qualification())) staff.setQualification(request.qualification());
        if (!isBlank(request.major())) staff.setMajor(request.major());
        if (request.experienceYears() != null) staff.setExperienceYears(request.experienceYears());
        if (!isBlank(request.note())) staff.setNote(request.note());
        healthCareStaffRepository.save(staff);

        return new HealthDtos.StaffProfileResponse(UserDto.from(dbUser), HealthDtos.StaffProfileDto.from(staff));
    }

    @PutMapping("/change-password")
    public java.util.Map<String, String> changePassword(@AuthenticationPrincipal CurrentUser user,
                                                        @RequestBody HealthDtos.ChangePasswordRequest request) {
        User dbUser = requireUser(user);
        String current = request.currentPassword();
        String newPassword = request.newPassword();
        String confirm = request.confirmPassword();
        if (isBlank(current) || isBlank(newPassword) || isBlank(confirm)) {
            throw new BadRequestException("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới");
        }
        if (!newPassword.equals(confirm)) {
            throw new BadRequestException("Xác nhận mật khẩu mới không khớp");
        }
        if (newPassword.equals(current)) {
            throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        if (newPassword.length() < 8 || newPassword.length() > 16) {
            throw new BadRequestException("Mật khẩu phải có từ 8-16 ký tự");
        }
        if (!newPassword.matches(".*[A-Z].*")) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 1 chữ hoa");
        }
        if (!newPassword.matches(".*[a-z].*")) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 1 chữ thường");
        }
        if (!newPassword.matches(".*[0-9].*")) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 1 số");
        }
        if (!newPassword.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new BadRequestException("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)");
        }
        if (dbUser.getPasswordHash() == null || !passwordEncoder.matches(current, dbUser.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        dbUser.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(dbUser);
        return java.util.Map.of("message", "Đổi mật khẩu thành công");
    }

    // ---------- Helpers ----------

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private UUID requireStaff(CurrentUser user) {
        if (user == null || user.role() != Role.HEALTH_CARE_STAFF) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        if (user.schoolId() == null) {
            throw new ForbiddenException("Không tìm thấy thông tin trường học");
        }
        return UUID.fromString(user.schoolId());
    }

    private User requireUser(CurrentUser user) {
        requireStaff(user);
        return userRepository.findById(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private HealthCareStaff requireStaffProfile(CurrentUser user) {
        return healthCareStaffRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new ForbiddenException("Không tìm thấy nhân viên y tế"));
    }

    private List<UUID> studentIdsOfSchool(UUID schoolId) {
        return studentRepository.findBySchoolIdOrderByFullNameAsc(schoolId).stream()
                .map(Student::getId)
                .toList();
    }

    private Student requireStudentOfSchool(String studentId, UUID schoolId) {
        if (isBlank(studentId)) {
            throw new BadRequestException("student_id là bắt buộc");
        }
        return studentRepository.findById(UUID.fromString(studentId))
                .filter(s -> s.getSchool() != null && s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));
    }
}
