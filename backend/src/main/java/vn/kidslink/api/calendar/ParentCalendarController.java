package vn.kidslink.api.calendar;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.ClassAgeMeal;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.DishesClassAgeMeal;
import vn.kidslink.domain.entity.ParentStudent;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.domain.repository.CalendarRepository;
import vn.kidslink.domain.repository.ClassAgeMealRepository;
import vn.kidslink.domain.repository.DishesClassAgeMealRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.SlotRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.security.CurrentUser;

/** Parent class calendar and weekly menu, ported from parent/calendarController.js and menuController.js. */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/parent")
public class ParentCalendarController {

    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentClassRepository studentClassRepository;
    private final CalendarRepository calendarRepository;
    private final SlotRepository slotRepository;
    private final ClassAgeMealRepository classAgeMealRepository;
    private final DishesClassAgeMealRepository dishesClassAgeMealRepository;

    public ParentCalendarController(ParentRepository parentRepository,
                                    ParentStudentRepository parentStudentRepository,
                                    StudentClassRepository studentClassRepository,
                                    CalendarRepository calendarRepository,
                                    SlotRepository slotRepository,
                                    ClassAgeMealRepository classAgeMealRepository,
                                    DishesClassAgeMealRepository dishesClassAgeMealRepository) {
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.studentClassRepository = studentClassRepository;
        this.calendarRepository = calendarRepository;
        this.slotRepository = slotRepository;
        this.classAgeMealRepository = classAgeMealRepository;
        this.dishesClassAgeMealRepository = dishesClassAgeMealRepository;
    }

    /** Calendar of the latest class of the parent's child. */
    @GetMapping("/class-calendar")
    public Map<String, Object> classCalendar(@AuthenticationPrincipal CurrentUser user,
                                             @RequestParam(name = "student_id", required = false) String studentId) {
        var parent = parentRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hồ sơ phụ huynh"));
        List<ParentStudent> children = parentStudentRepository.findByParentId(parent.getId());
        if (children.isEmpty()) {
            throw new NotFoundException("Phụ huynh chưa có học sinh liên kết");
        }
        UUID targetId = targetStudent(children, studentId);
        ClassEntity latest = latestClass(targetId);

        Map<String, Object> classHeader = new LinkedHashMap<>();
        classHeader.put("id", latest.getId().toString());
        classHeader.put("name", latest.getClassName());
        classHeader.put("academic_year", latest.getAcademicYear());
        classHeader.put("teacher", CalendarDtos.TeacherBrief.from(latest.getTeacher()));

        return Map.of(
                "class", classHeader,
                "calendars", calendarRepository
                        .findByClassEntityIdOrderByDateAscSlotStartTimeAsc(latest.getId()).stream()
                        .map(calendar -> Map.of(
                                "id", calendar.getId().toString(),
                                "date", calendar.getDate().toString(),
                                "weekday", calendar.getWeekday().getDayOfWeek(),
                                "slots", List.of(CalendarDtos.EntryDto.from(calendar))))
                        .toList());
    }

    /** Standard time slots of the parent's school. */
    @GetMapping("/class-calendar/slots")
    public List<CalendarDtos.SlotDto> classSlots(@AuthenticationPrincipal CurrentUser user) {
        requireParent(user);
        return slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId(user)).stream()
                .map(CalendarDtos.SlotDto::from).toList();
    }

    /** Weekly menu of the child's class age, newest date first (FE filters by week). */
    @GetMapping("/menu")
    public Map<String, Object> menu(@AuthenticationPrincipal CurrentUser user,
                                    @RequestParam(name = "student_id", required = false) String studentId) {
        var parent = parentRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hồ sơ phụ huynh"));
        List<ParentStudent> children = parentStudentRepository.findByParentId(parent.getId());
        if (children.isEmpty()) {
            throw new NotFoundException("Phụ huynh chưa có học sinh liên kết");
        }
        ClassEntity latest = latestClass(targetStudent(children, studentId));

        List<ClassAgeMeal> classAgeMeals = classAgeMealRepository
                .findByClassAgeIdOrderByDateDesc(latest.getClassAge().getId());
        Map<UUID, List<DishesClassAgeMeal>> dishesByCam = new LinkedHashMap<>();
        if (!classAgeMeals.isEmpty()) {
            for (DishesClassAgeMeal link : dishesClassAgeMealRepository
                    .findByClassAgeMealIdIn(classAgeMeals.stream().map(ClassAgeMeal::getId).toList())) {
                dishesByCam.computeIfAbsent(link.getClassAgeMeal().getId(), id -> new ArrayList<>()).add(link);
            }
        }

        // Group by date, then by meal name ("Bữa sáng": [dish, ...]).
        Map<String, Map<String, Object>> byDate = new LinkedHashMap<>();
        for (ClassAgeMeal cam : classAgeMeals) {
            Map<String, Object> day = byDate.computeIfAbsent(cam.getDate().toString(), d -> {
                Map<String, Object> bucket = new LinkedHashMap<>();
                bucket.put("date", d);
                bucket.put("weekday", cam.getWeekday().getDayOfWeek());
                bucket.put("meals", new LinkedHashMap<String, List<Map<String, Object>>>());
                return bucket;
            });
            @SuppressWarnings("unchecked")
            Map<String, List<Map<String, Object>>> meals =
                    (Map<String, List<Map<String, Object>>>) day.get("meals");
            meals.computeIfAbsent(cam.getMeal().getMeal(), m -> new ArrayList<>());
            for (DishesClassAgeMeal link : dishesByCam.getOrDefault(cam.getId(), List.of())) {
                meals.get(cam.getMeal().getMeal()).add(Map.of(
                        "id", link.getDish().getId().toString(),
                        "name", link.getDish().getDishName(),
                        "description", link.getDish().getDescription()));
            }
        }

        return Map.of(
                "class", Map.of(
                        "id", latest.getId().toString(),
                        "name", latest.getClassName(),
                        "academic_year", latest.getAcademicYear()),
                "class_age", CalendarDtos.ClassAgeBrief.from(latest.getClassAge()),
                "menus", new ArrayList<>(byDate.values()));
    }

    // ---------- helpers ----------

    private UUID targetStudent(List<ParentStudent> children, String requestedStudentId) {
        if (requestedStudentId != null && !requestedStudentId.isBlank()) {
            boolean owned = children.stream()
                    .anyMatch(link -> link.getStudent().getId().toString().equals(requestedStudentId));
            if (!owned) {
                throw new ForbiddenException("Học sinh không thuộc phụ huynh này");
            }
            return UUID.fromString(requestedStudentId);
        }
        return children.get(0).getStudent().getId();
    }

    private ClassEntity latestClass(UUID studentId) {
        List<StudentClass> studentClasses = studentClassRepository.findByStudentId(studentId);
        if (studentClasses.isEmpty()) {
            throw new NotFoundException("Học sinh chưa được xếp lớp");
        }
        return studentClasses.stream()
                .map(StudentClass::getClassEntity)
                .max(Comparator.comparing(ClassEntity::getAcademicYear))
                .orElseThrow();
    }

    private void requireParent(CurrentUser user) {
        if (user == null || user.role() != Role.PARENT) {
            throw new ForbiddenException("Chỉ phụ huynh được thực hiện thao tác này");
        }
    }

    private UUID schoolId(CurrentUser user) {
        if (user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
