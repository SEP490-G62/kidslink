package vn.kidslink.api.pickup;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
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
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ConflictException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.Pickup;
import vn.kidslink.domain.entity.PickupStudent;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.domain.repository.HealthCareStaffRepository;
import vn.kidslink.domain.repository.HealthNoticeRepository;
import vn.kidslink.domain.repository.HealthRecordRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.PickupRepository;
import vn.kidslink.domain.repository.PickupStudentRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.StudentRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/parent")
public class ParentChildInfoController {

    private static final DateTimeFormatter LEGACY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String DEFAULT_AVATAR =
            "https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png";

    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final HealthNoticeRepository healthNoticeRepository;
    private final HealthCareStaffRepository healthCareStaffRepository;
    private final PickupRepository pickupRepository;
    private final PickupStudentRepository pickupStudentRepository;

    public ParentChildInfoController(ParentRepository parentRepository,
                                     ParentStudentRepository parentStudentRepository,
                                     StudentRepository studentRepository,
                                     StudentClassRepository studentClassRepository,
                                     HealthRecordRepository healthRecordRepository,
                                     HealthNoticeRepository healthNoticeRepository,
                                     HealthCareStaffRepository healthCareStaffRepository,
                                     PickupRepository pickupRepository,
                                     PickupStudentRepository pickupStudentRepository) {
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.healthNoticeRepository = healthNoticeRepository;
        this.healthCareStaffRepository = healthCareStaffRepository;
        this.pickupRepository = pickupRepository;
        this.pickupStudentRepository = pickupStudentRepository;
    }

    // ---------- DTOs ----------

    public record PickupDto(String id, String fullName, String relationship, String idCardNumber,
                            String avatarUrl, String phone) {
        public static PickupDto from(Pickup pickup) {
            return new PickupDto(
                    pickup.getId().toString(),
                    pickup.getFullName(),
                    pickup.getRelationship(),
                    pickup.getIdCardNumber(),
                    pickup.getAvatarUrl(),
                    pickup.getPhone());
        }
    }

    public record PickupRequest(String fullName, String relationship, String idCardNumber,
                                String avatarUrl, String phone) {
    }

    public record ChildStudent(String id, String fullName, String dob, int age, String gender,
                               String avatarUrl, Short status, String allergy, String relationship) {
    }

    public record ClassTeacher(String id, String name, String phone, String avatar) {
    }

    public record ClassInfo(String id, String name, String academicYear, LocalDate startDate,
                            LocalDate endDate, ClassTeacher teacher) {
    }

    public record HealthItem(String id, String type, String date, String height, String weight,
                             String time, String symptoms, String actionsTaken, String medications,
                             String note, String staff) {
    }

    public record ChildInfo(ChildStudent student, List<PickupDto> pickups, List<HealthItem> healthRecords,
                            long healthNoticesCount, ClassInfo classInfo) {
    }


    public record ChildSummary(String id, String fullName, String dob, int age, String gender,
                               String avatarUrl, Short status, String allergy, String relationship,
                               String classId, String className) {
    }

    @GetMapping("/children")
    public List<ChildSummary> children(@AuthenticationPrincipal CurrentUser user) {
        Parent parent = requireParent(user);
        return parentStudentRepository.findByParentId(parent.getId()).stream().map(link -> {
            Student student = link.getStudent();
            String classId = null;
            String className = null;
            for (var sc : studentClassRepository.findByStudent_Id(student.getId())) {
                classId = sc.getClassEntity().getId().toString();
                className = sc.getClassEntity().getClassName();
                break;
            }
            int age = student.getDob() == null ? 0
                    : java.time.Period.between(student.getDob(), java.time.LocalDate.now()).getYears();
            String gender = student.getGender() != null && student.getGender() == 1 ? "Ná»¯" : "Nam";
            return new ChildSummary(
                    student.getId().toString(),
                    student.getFullName(),
                    student.getDob() == null ? null : student.getDob().toString(),
                    age,
                    gender,
                    student.getAvatarUrl(),
                    student.getStatus(),
                    student.getAllergy(),
                    link.getRelationship(),
                    classId,
                    className);
        }).toList();
    }

    // ---------- Endpoints ----------

    @GetMapping("/child-info/{studentId}")
    public ChildInfo childInfo(@AuthenticationPrincipal CurrentUser user, @PathVariable String studentId) {
        Parent parent = requireParent(user);
        var link = parentStudentRepository
                .findByParentIdAndStudentId(parent.getId(), UUID.fromString(studentId))
                .orElseThrow(() -> new ForbiddenException("Bạn không có quyền xem thông tin học sinh này"));
        Student student = studentRepository.findById(UUID.fromString(studentId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));

        List<PickupDto> pickups = pickupStudentRepository.findByStudentId(student.getId()).stream()
                .map(ps -> PickupDto.from(ps.getPickup()))
                .toList();

        List<HealthItem> records = healthRecordRepository
                .findByStudentIdOrderByCheckupDateDesc(student.getId()).stream()
                .limit(10)
                .map(r -> new HealthItem(
                        r.getId().toString(),
                        "Khám sức khỏe",
                        r.getCheckupDate().format(LEGACY_DATE),
                        r.getHeightCm() + " cm",
                        r.getWeightKg() + " kg",
                        null, null, null, null,
                        r.getNote(),
                        staffName(r.getHealthCareStaff().getId())))
                .toList();

        var notices = healthNoticeRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .limit(10)
                .map(n -> new HealthItem(
                        n.getId().toString(),
                        "Thông báo sức khỏe",
                        n.getCreatedAt().atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate()
                                .format(LEGACY_DATE),
                        null, null,
                        n.getNoticeTime(),
                        n.getSymptoms(), n.getActionsTaken(), n.getMedications(),
                        n.getNote(),
                        staffName(n.getHealthCareStaff().getId())))
                .toList();

        List<HealthItem> allHealth = new ArrayList<>(records);
        allHealth.addAll(notices);
        allHealth.sort(Comparator.comparing((HealthItem h) -> h.date()).reversed());
        if (allHealth.size() > 10) {
            allHealth = allHealth.subList(0, 10);
        }

        return new ChildInfo(
                new ChildStudent(
                        student.getId().toString(),
                        student.getFullName(),
                        student.getDob().format(LEGACY_DATE),
                        Period.between(student.getDob(), LocalDate.now()).getYears(),
                        student.getGender() != null && student.getGender() == 0 ? "Nam" : "Nữ",
                        student.getAvatarUrl(),
                        student.getStatus(),
                        student.getAllergy(),
                        link.getRelationship()),
                pickups,
                allHealth,
                notices.size(),
                currentClassOf(student.getId()));
    }

    @PostMapping("/pickups/{studentId}")
    public ResponseEntity<PickupDto> addPickup(@AuthenticationPrincipal CurrentUser user,
                                               @PathVariable String studentId,
                                               @RequestBody PickupRequest request) {
        Parent parent = requireParent(user);
        requireOwnStudent(parent, studentId, "Bạn không có quyền thêm người đón cho học sinh này");
        validatePickupRequest(request);
        List<UUID> activeChildren = activeChildrenOf(parent);

        // Pickups are unique school-wide by id_card_number and phone: reuse instead of duplicating.
        Pickup pickup = pickupRepository.findByIdCardNumber(request.idCardNumber()).orElse(null);
        Pickup byPhone = pickupRepository.findByPhone(request.phone()).stream().findFirst().orElse(null);
        if (pickup == null) {
            pickup = byPhone;
        }
        if (pickup != null && byPhone != null && !pickup.getId().equals(byPhone.getId())) {
            throw new ConflictException("Số CMND/CCCD và số điện thoại đã thuộc hai người đón khác nhau");
        }
        if (pickup != null) {
            if (!pickup.getFullName().equalsIgnoreCase(request.fullName().trim())
                    || !pickup.getIdCardNumber().equals(request.idCardNumber().trim())
                    || !pickup.getPhone().equals(request.phone().trim())) {
                throw new ConflictException("Thông tin người đón đã tồn tại với dữ liệu khác");
            }
        } else {
            pickup = new Pickup();
            pickup.setFullName(request.fullName().trim());
            pickup.setIdCardNumber(request.idCardNumber().trim());
            pickup.setPhone(request.phone().trim());
        }
        pickup.setRelationship(request.relationship().trim());
        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            pickup.setAvatarUrl(request.avatarUrl().trim());
        } else if (pickup.getAvatarUrl() == null || pickup.getAvatarUrl().isBlank()) {
            pickup.setAvatarUrl(DEFAULT_AVATAR);
        }
        pickupRepository.save(pickup);

        linkToChildren(pickup, activeChildren);
        return ResponseEntity.status(201).body(PickupDto.from(pickup));
    }

    @PutMapping("/pickups/{pickupId}/{studentId}")
    public PickupDto updatePickup(@AuthenticationPrincipal CurrentUser user,
                                  @PathVariable String pickupId,
                                  @PathVariable String studentId,
                                  @RequestBody PickupRequest request) {
        Parent parent = requireParent(user);
        requireOwnStudent(parent, studentId, "Bạn không có quyền cập nhật người đón cho học sinh này");
        validatePickupRequest(request);
        UUID pickupUuid = UUID.fromString(pickupId);
        pickupStudentRepository.findByPickupIdAndStudentId(pickupUuid, UUID.fromString(studentId))
                .orElseThrow(() -> new ForbiddenException("Người đón này không thuộc về học sinh này"));

        Pickup pickup = pickupRepository.findById(pickupUuid)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người đón"));
        pickupRepository.findByIdCardNumber(request.idCardNumber().trim())
                .filter(other -> !other.getId().equals(pickupUuid))
                .ifPresent(other -> {
                    throw new ConflictException("Số CMND/CCCD đã thuộc người đón khác");
                });
        pickupRepository.findByPhone(request.phone().trim()).stream()
                .filter(other -> !other.getId().equals(pickupUuid))
                .findFirst()
                .ifPresent(other -> {
                    throw new ConflictException("Số điện thoại đã thuộc người đón khác");
                });

        pickup.setFullName(request.fullName().trim());
        pickup.setRelationship(request.relationship().trim());
        pickup.setIdCardNumber(request.idCardNumber().trim());
        pickup.setPhone(request.phone().trim());
        if (request.avatarUrl() == null || request.avatarUrl().isBlank()) {
            pickup.setAvatarUrl(DEFAULT_AVATAR);
        } else {
            pickup.setAvatarUrl(request.avatarUrl().trim());
        }
        pickupRepository.save(pickup);
        linkToChildren(pickup, activeChildrenOf(parent));
        return PickupDto.from(pickup);
    }

    @DeleteMapping("/pickups/{pickupId}/{studentId}")
    public Map<String, String> deletePickup(@AuthenticationPrincipal CurrentUser user,
                                            @PathVariable String pickupId,
                                            @PathVariable String studentId) {
        Parent parent = requireParent(user);
        requireOwnStudent(parent, studentId, "Bạn không có quyền xóa người đón cho học sinh này");
        UUID pickupUuid = UUID.fromString(pickupId);
        pickupStudentRepository.findByPickupIdAndStudentId(pickupUuid, UUID.fromString(studentId))
                .orElseThrow(() -> new ForbiddenException("Người đón này không thuộc về học sinh này"));

        for (UUID childId : activeChildrenOf(parent)) {
            pickupStudentRepository.findByPickupIdAndStudentId(pickupUuid, childId)
                    .ifPresent(pickupStudentRepository::delete);
        }
        if (pickupStudentRepository.findByPickupId(pickupUuid).isEmpty()) {
            pickupRepository.findById(pickupUuid).ifPresent(pickupRepository::delete);
        }
        return Map.of("message", "Xóa người đón thành công");
    }

    // ---------- Helpers ----------

    private Parent requireParent(CurrentUser user) {
        if (user == null || user.role() != Role.PARENT) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        return parentRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));
    }

    private void requireOwnStudent(Parent parent, String studentId, String message) {
        if (parentStudentRepository.findByParentIdAndStudentId(parent.getId(), UUID.fromString(studentId))
                .isEmpty()) {
            throw new ForbiddenException(message);
        }
    }

    private void validatePickupRequest(PickupRequest request) {
        if (isBlank(request.fullName()) || isBlank(request.relationship())
                || isBlank(request.idCardNumber()) || isBlank(request.phone())) {
            throw new BadRequestException("Vui lòng điền đầy đủ thông tin");
        }
    }

    private List<UUID> activeChildrenOf(Parent parent) {
        return parentStudentRepository.findByParentId(parent.getId()).stream()
                .map(ps -> ps.getStudent())
                .filter(s -> s.getStatus() != null && s.getStatus() == 1)
                .map(Student::getId)
                .toList();
    }

    private void linkToChildren(Pickup pickup, List<UUID> studentIds) {
        for (UUID studentId : studentIds) {
            if (pickupStudentRepository.findByPickupIdAndStudentId(pickup.getId(), studentId).isEmpty()) {
                PickupStudent link = new PickupStudent();
                link.setPickup(pickup);
                link.setStudent(studentRepository.getReferenceById(studentId));
                pickupStudentRepository.save(link);
            }
        }
    }

    private ClassInfo currentClassOf(UUID studentId) {
        return studentClassRepository.findByStudentId(studentId).stream()
                .map(StudentClass::getClassEntity)
                .filter(c -> c != null)
                .max(Comparator.comparing(c -> academicYear(c.getAcademicYear())))
                .map(c -> new ClassInfo(
                        c.getId().toString(),
                        c.getClassName(),
                        c.getAcademicYear(),
                        c.getStartDate(),
                        c.getEndDate(),
                        c.getTeacher() == null ? null : new ClassTeacher(
                                c.getTeacher().getId().toString(),
                                c.getTeacher().getUser().getFullName(),
                                c.getTeacher().getUser().getPhoneNumber(),
                                c.getTeacher().getUser().getAvatarUrl())))
                .orElse(null);
    }

    private String staffName(UUID staffId) {
        return healthCareStaffRepository.findById(staffId)
                .map(s -> s.getUser().getFullName())
                .orElse("N/A");
    }

    private int academicYear(String value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.split("-")[0]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
