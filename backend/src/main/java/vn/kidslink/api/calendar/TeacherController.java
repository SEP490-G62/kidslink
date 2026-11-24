package vn.kidslink.api.calendar;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.Calendar;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.DailyReport;
import vn.kidslink.domain.entity.ParentStudent;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.Teacher;
import vn.kidslink.domain.repository.CalendarRepository;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.DailyReportRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.PickupRepository;
import vn.kidslink.domain.repository.PickupStudentRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.StudentRepository;
import vn.kidslink.domain.repository.SlotRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.security.CurrentUser;

/**
 * Teacher class roster, attendance and calendar endpoints, ported from teacherController.js.
 * Only the class/attendance/calendar/student-detail surface lives here; posts, complaints and
 * daily-report writes are separate controllers.
 */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final StudentClassRepository studentClassRepository;
    private final DailyReportRepository dailyReportRepository;
    private final CalendarRepository calendarRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final PickupRepository pickupRepository;
    private final PickupStudentRepository pickupStudentRepository;
    private final StudentRepository studentRepository;
    private final SlotRepository slotRepository;

    public TeacherController(TeacherRepository teacherRepository,
                             ClassRepository classRepository,
                             StudentClassRepository studentClassRepository,
                             DailyReportRepository dailyReportRepository,
                             CalendarRepository calendarRepository,
                             ParentRepository parentRepository,
                             ParentStudentRepository parentStudentRepository,
                             PickupRepository pickupRepository,
                             PickupStudentRepository pickupStudentRepository,
                             StudentRepository studentRepository,
                             SlotRepository slotRepository) {
        this.teacherRepository = teacherRepository;
        this.classRepository = classRepository;
        this.studentClassRepository = studentClassRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.calendarRepository = calendarRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.pickupRepository = pickupRepository;
        this.pickupStudentRepository = pickupStudentRepository;
        this.studentRepository = studentRepository;
        this.slotRepository = slotRepository;
    }

    /** Classes of the teacher grouped by academic year (latest first). */
    @GetMapping("/class")
    public Map<String, Object> myClasses(@AuthenticationPrincipal CurrentUser user) {
        Teacher teacher = requireTeacher(user);
        List<ClassEntity> classes = classesOf(teacher);

        Map<String, List<CalendarDtos.ClassBrief>> grouped = new LinkedHashMap<>();
        for (ClassEntity entity : classes) {
            grouped.computeIfAbsent(entity.getAcademicYear(), y -> new ArrayList<>())
                    .add(CalendarDtos.ClassBrief.from(entity));
        }
        List<Map<String, Object>> data = grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.reverseOrder()))
                .map(entry -> Map.<String, Object>of(
                        "academic_year", entry.getKey(), "classes", entry.getValue()))
                .toList();

        String latestYear = classRepository.findBySchoolIdOrderByClassNameAsc(schoolId(user)).stream()
                .map(ClassEntity::getAcademicYear)
                .distinct()
                .max(Comparator.naturalOrder())
                .orElse(null);
        boolean hasLatest = latestYear != null && classes.stream()
                .anyMatch(c -> latestYear.equals(c.getAcademicYear()));

        return Map.of(
                "teacher_id", teacher.getId().toString(),
                "data", data,
                "metadata", Map.of(
                        "latest_academic_year", latestYear == null ? "" : latestYear,
                        "has_latest_academic_year_class", hasLatest,
                        "school_id", schoolId(user).toString()));
    }

    /** Students of the teacher's class; class_id optional (defaults to latest-year class). */
    @GetMapping("/class/students")
    public Map<String, Object> classStudents(@AuthenticationPrincipal CurrentUser user,
                                            @RequestParam(name = "class_id", required = false) String classId) {
        Teacher teacher = requireTeacher(user);
        ClassEntity classEntity = resolveClass(teacher, user, classId);
        List<Map<String, Object>> students = studentsOfClass(classEntity);
        return Map.of(
                "class_id", classEntity.getId().toString(),
                "class_info", classInfo(classEntity),
                "count", students.size(),
                "students", students);
    }

    /** Attendance of the teacher's class on a date. */
    @GetMapping("/class/students/attendance/{date}")
    public Map<String, Object> attendance(@AuthenticationPrincipal CurrentUser user,
                                          @PathVariable String date,
                                          @RequestParam(name = "class_id", required = false) String classId) {
        Teacher teacher = requireTeacher(user);
        ClassEntity classEntity = resolveClass(teacher, user, classId);
        LocalDate reportDate;
        try {
            reportDate = LocalDate.parse(date);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Ngày không hợp lệ");
        }

        List<vn.kidslink.domain.entity.StudentClass> mappings =
                studentClassRepository.findByClassEntityId(classEntity.getId());
        List<UUID> studentIds = mappings.stream().map(m -> m.getStudent().getId()).toList();
        Map<UUID, DailyReport> reports = new LinkedHashMap<>();
        for (DailyReport report : dailyReportRepository.findByStudentIdInAndReportDate(studentIds, reportDate)) {
            reports.put(report.getStudent().getId(), report);
        }

        List<Map<String, Object>> students = new ArrayList<>();
        int checkedIn = 0;
        int checkedOut = 0;
        for (vn.kidslink.domain.entity.StudentClass mapping : mappings) {
            Student student = mapping.getStudent();
            DailyReport report = reports.get(student.getId());
            boolean hasCheckin = report != null && report.getCheckinTime() != null;
            boolean hasCheckout = report != null && report.getCheckoutTime() != null;
            if (hasCheckin) checkedIn++;
            if (hasCheckout) checkedOut++;

            Map<String, Object> attendanceInfo = new LinkedHashMap<>();
            attendanceInfo.put("has_checkin", hasCheckin);
            attendanceInfo.put("has_checkout", hasCheckout);
            attendanceInfo.put("checkin_time", report == null ? null : report.getCheckinTime());
            attendanceInfo.put("checkout_time", report == null ? null : report.getCheckoutTime());

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", student.getId().toString());
            item.put("full_name", student.getFullName());
            item.put("avatar_url", student.getAvatarUrl());
            item.put("dob", student.getDob());
            item.put("gender", student.getGender());
            item.put("status", student.getStatus());
            item.put("allergy", student.getAllergy());
            item.put("discount", mapping.getDiscount());
            item.put("attendance", attendanceInfo);
            item.put("report", report == null ? null : reportDto(report));
            students.add(item);
        }

        int total = students.size();
        return Map.of(
                "class_id", classEntity.getId().toString(),
                "date", reportDate.toString(),
                "class_info", classInfo(classEntity),
                "statistics", Map.of(
                        "total_students", total,
                        "checked_in", checkedIn,
                        "checked_out", checkedOut,
                        "attendance_rate", total == 0 ? 0 : Math.round(checkedIn * 100.0 / total)),
                "students", students,
                "has_schedule", calendarRepository.existsByClassEntityIdAndDate(classEntity.getId(), reportDate));
    }

    /** Full calendar of the teacher's latest class. */
    @GetMapping("/class-calendar")
    public Map<String, Object> classCalendar(@AuthenticationPrincipal CurrentUser user) {
        Teacher teacher = requireTeacher(user);
        List<ClassEntity> classes = classesOf(teacher);
        ClassEntity latest = latestClass(classes);
        Map<String, Object> result = new LinkedHashMap<>();
        if (latest == null) {
            result.put("class", null);
            result.put("calendars", List.of());
            return result;
        }
        result.put("class", classHeader(latest));
        result.put("calendars", calendarRepository
                .findByClassEntityIdOrderByDateAscSlotStartTimeAsc(latest.getId()).stream()
                .map(TeacherController::calendarDayDto).toList());
        return result;
    }

    /** All periods the teacher teaches, grouped by date across classes. */
    @GetMapping("/teaching-calendar")
    public Map<String, Object> teachingCalendar(@AuthenticationPrincipal CurrentUser user) {
        Teacher teacher = requireTeacher(user);
        List<Calendar> calendars = calendarRepository
                .findByTeacherIdOrderByDateAscSlotStartTimeAsc(teacher.getId());

        Map<String, List<Map<String, Object>>> byDate = new LinkedHashMap<>();
        Map<String, Map<String, Object>> classesById = new LinkedHashMap<>();
        for (Calendar calendar : calendars) {
            ClassEntity classEntity = calendar.getClassEntity();
            classesById.putIfAbsent(classEntity.getId().toString(), Map.of(
                    "id", classEntity.getId().toString(),
                    "name", classEntity.getClassName(),
                    "academic_year", classEntity.getAcademicYear()));
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("id", calendar.getId().toString());
            slot.put("class_id", classEntity.getId().toString());
            slot.put("class_name", classEntity.getClassName());
            slot.put("slot_name", calendar.getSlot().getSlotName());
            slot.put("start_time", calendar.getSlot().getStartTime());
            slot.put("end_time", calendar.getSlot().getEndTime());
            slot.put("activity", CalendarDtos.ActivityDto.from(calendar.getActivity()));
            slot.put("teacher", CalendarDtos.TeacherBrief.from(calendar.getTeacher()));
            byDate.computeIfAbsent(calendar.getDate().toString(), d -> new ArrayList<>()).add(slot);
        }

        List<Map<String, Object>> grouped = byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> Map.<String, Object>of("date", entry.getKey(), "slots", entry.getValue()))
                .toList();

        if (classesById.isEmpty()) {
            // no calendars: fall back to the teacher's own classes
            for (ClassEntity entity : classesOf(teacher)) {
                classesById.put(entity.getId().toString(), Map.of(
                        "id", entity.getId().toString(),
                        "name", entity.getClassName(),
                        "academic_year", entity.getAcademicYear()));
            }
        }
        return Map.of(
                "classes", new ArrayList<>(classesById.values()),
                "calendars", grouped);
    }

    /** Standard time slots of the teacher's school. */
    @GetMapping("/class-calendar/slots")
    public List<CalendarDtos.SlotDto> classSlots(@AuthenticationPrincipal CurrentUser user) {
        requireTeacher(user);
        return slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId(user)).stream()
                .map(CalendarDtos.SlotDto::from).toList();
    }

    /** Student detail visible to the teacher (own school only). */
    @GetMapping("/students/{id}")
    public Map<String, Object> studentDetail(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        requireTeacher(user);
        Student student = studentRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));
        if (student.getSchool() == null || !student.getSchool().getId().equals(schoolId(user))) {
            throw new ForbiddenException("Bạn không có quyền xem học sinh thuộc trường khác");
        }

        List<Map<String, Object>> parents = parentStudentRepository.findByStudentId(student.getId()).stream()
                .map(link -> {
                    var parentUser = link.getParent().getUser();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("parent_id", link.getParent().getId().toString());
                    item.put("relationship", link.getRelationship());
                    item.put("user", Map.of(
                            "user_id", parentUser.getId().toString(),
                            "full_name", parentUser.getFullName(),
                            "username", parentUser.getUsername() == null ? "" : parentUser.getUsername(),
                            "email", parentUser.getEmail() == null ? "" : parentUser.getEmail(),
                            "phone_number", parentUser.getPhoneNumber() == null ? "" : parentUser.getPhoneNumber(),
                            "avatar_url", parentUser.getAvatarUrl(),
                            "status", parentUser.getStatus()));
                    return item;
                }).toList();

        List<Map<String, Object>> pickups = pickupStudentRepository.findByStudentId(student.getId()).stream()
                .map(link -> {
                    var pickup = link.getPickup();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", pickup.getId().toString());
                    item.put("full_name", pickup.getFullName());
                    item.put("relationship", pickup.getRelationship());
                    item.put("id_card_number", pickup.getIdCardNumber());
                    item.put("avatar_url", pickup.getAvatarUrl());
                    item.put("phone", pickup.getPhone());
                    return item;
                }).toList();

        List<CalendarDtos.ClassBrief> classes = studentClassRepository.findByStudentId(student.getId()).stream()
                .map(m -> CalendarDtos.ClassBrief.from(m.getClassEntity()))
                .toList();

        return Map.of(
                "student", Map.of(
                        "id", student.getId().toString(),
                        "full_name", student.getFullName(),
                        "dob", student.getDob(),
                        "gender", student.getGender(),
                        "avatar_url", student.getAvatarUrl(),
                        "status", student.getStatus(),
                        "allergy", student.getAllergy(),
                        "school_id", student.getSchool().getId().toString()),
                "parents", parents,
                "pickups", pickups,
                "classes", classes);
    }

    // ---------- helpers ----------


    private static Map<String, Object> calendarDayDto(Calendar calendar) {
        return Map.of(
                "id", calendar.getId().toString(),
                "date", calendar.getDate().toString(),
                "weekday", calendar.getWeekday().getDayOfWeek(),
                "slots", List.of(CalendarDtos.EntryDto.from(calendar)));
    }

    private static Map<String, Object> classHeader(ClassEntity entity) {
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("id", entity.getId().toString());
        header.put("name", entity.getClassName());
        header.put("academic_year", entity.getAcademicYear());
        header.put("teacher", CalendarDtos.TeacherBrief.from(entity.getTeacher()));
        return header;
    }

    private static Map<String, Object> reportDto(DailyReport report) {
        return Map.of(
                "id", report.getId().toString(),
                "report_date", report.getReportDate(),
                "checkin_time", report.getCheckinTime() == null ? "" : report.getCheckinTime(),
                "checkout_time", report.getCheckoutTime() == null ? "" : report.getCheckoutTime(),
                "comments", report.getComments() == null ? "" : report.getComments(),
                "student_id", report.getStudent().getId().toString(),
                "teacher_checkin_id", report.getTeacherCheckin() == null ? ""
                        : report.getTeacherCheckin().getId().toString(),
                "teacher_checkout_id", report.getTeacherCheckout() == null ? ""
                        : report.getTeacherCheckout().getId().toString());
    }

    private Map<String, Object> classInfo(ClassEntity entity) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", entity.getId().toString());
        info.put("class_name", entity.getClassName());
        info.put("academic_year", entity.getAcademicYear());
        info.put("class_age", CalendarDtos.ClassAgeBrief.from(entity.getClassAge()));
        info.put("school_id", entity.getSchool().getId().toString());
        return info;
    }

    private List<Map<String, Object>> studentsOfClass(ClassEntity entity) {
        return studentClassRepository.findByClassEntityId(entity.getId()).stream()
                .map(mapping -> {
                    Student student = mapping.getStudent();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", student.getId().toString());
                    item.put("full_name", student.getFullName());
                    item.put("avatar_url", student.getAvatarUrl());
                    item.put("dob", student.getDob());
                    item.put("gender", student.getGender());
                    item.put("status", student.getStatus());
                    item.put("allergy", student.getAllergy());
                    item.put("discount", mapping.getDiscount());
                    return item;
                }).toList();
    }

    private List<ClassEntity> classesOf(Teacher teacher) {
        return classRepository.findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(
                teacher.getId(), teacher.getId());
    }

    private ClassEntity latestClass(List<ClassEntity> classes) {
        return classes.stream()
                .max(Comparator.comparing(ClassEntity::getAcademicYear))
                .orElse(null);
    }

    private ClassEntity resolveClass(Teacher teacher, CurrentUser user, String classId) {
        if (classId == null || classId.isBlank()) {
            List<ClassEntity> classes = classesOf(teacher);
            ClassEntity latest = classes.stream()
                    .filter(c -> c.getAcademicYear().equals(latestYearOf(classes)))
                    .min(Comparator.comparing(ClassEntity::getClassName))
                    .orElse(null);
            if (latest == null) {
                throw new NotFoundException("Giáo viên chưa có lớp học");
            }
            return latest;
        }
        ClassEntity entity = classRepository.findById(UUID.fromString(classId))
                .filter(c -> c.getTeacher() != null && c.getTeacher().getId().equals(teacher.getId())
                        || c.getCoTeacher() != null && c.getCoTeacher().getId().equals(teacher.getId()))
                .orElseThrow(() -> new ForbiddenException("Không có quyền truy cập lớp này"));
        if (!entity.getSchool().getId().equals(schoolId(user))) {
            throw new ForbiddenException("Không có quyền truy cập lớp này");
        }
        return entity;
    }

    private String latestYearOf(List<ClassEntity> classes) {
        return classes.stream().map(ClassEntity::getAcademicYear)
                .max(Comparator.naturalOrder()).orElse("");
    }

    private Teacher requireTeacher(CurrentUser user) {
        if (user == null || user.role() != Role.TEACHER) {
            throw new ForbiddenException("Chỉ giáo viên được thực hiện thao tác này");
        }
        return teacherRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên"));
    }

    private UUID schoolId(CurrentUser user) {
        if (user == null || user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
