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
import vn.kidslink.domain.entity.Activity;
import vn.kidslink.domain.entity.Calendar;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.Slot;
import vn.kidslink.domain.entity.Teacher;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.entity.WeekDay;
import vn.kidslink.domain.repository.ActivityRepository;
import vn.kidslink.domain.repository.CalendarRepository;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.domain.repository.SlotRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.domain.repository.WeekDayRepository;
import vn.kidslink.security.CurrentUser;

/** School-admin slot / activity / calendar management, ported from schoolAdminCalendarController.js. */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/school-admin/calendar")
public class SchoolAdminCalendarController {

    private static final List<String> WEEKDAY_NAMES = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");

    private final SlotRepository slotRepository;
    private final ActivityRepository activityRepository;
    private final CalendarRepository calendarRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    private final WeekDayRepository weekDayRepository;
    private final SchoolRepository schoolRepository;

    public SchoolAdminCalendarController(SlotRepository slotRepository,
                                         ActivityRepository activityRepository,
                                         CalendarRepository calendarRepository,
                                         ClassRepository classRepository,
                                         TeacherRepository teacherRepository,
                                         WeekDayRepository weekDayRepository,
                                         SchoolRepository schoolRepository) {
        this.slotRepository = slotRepository;
        this.activityRepository = activityRepository;
        this.calendarRepository = calendarRepository;
        this.classRepository = classRepository;
        this.teacherRepository = teacherRepository;
        this.weekDayRepository = weekDayRepository;
        this.schoolRepository = schoolRepository;
    }

    // ---------- Slots ----------

    @GetMapping("/slots")
    public List<CalendarDtos.SlotDto> slots(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId).stream()
                .map(CalendarDtos.SlotDto::from).toList();
    }

    @PostMapping("/slots")
    public ResponseEntity<CalendarDtos.SlotDto> createSlot(@AuthenticationPrincipal CurrentUser user,
                                                            @RequestBody SlotRequest request) {
        UUID schoolId = requireSchool(user);
        String slotName = requireName(request.slotName(), "Vui lòng cung cấp tên tiết học");
        String startTime = requireTime(request.startTime());
        String endTime = requireTime(request.endTime());
        if (toMinutes(startTime) >= toMinutes(endTime)) {
            throw new BadRequestException("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        }
        checkOverlap(schoolId, null, startTime, endTime);
        Slot slot = new Slot();
        slot.setSlotName(slotName);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setSchool(school(schoolId));
        slotRepository.save(slot);
        return ResponseEntity.status(201).body(CalendarDtos.SlotDto.from(slot));
    }

    @PutMapping("/slots/{slotId}")
    public CalendarDtos.SlotDto updateSlot(@AuthenticationPrincipal CurrentUser user,
                                           @PathVariable String slotId,
                                           @RequestBody SlotRequest request) {
        UUID schoolId = requireSchool(user);
        Slot slot = slotInSchool(slotId, schoolId);
        String slotName = requireName(request.slotName(), "Vui lòng cung cấp tên tiết học");
        String startTime = requireTime(request.startTime());
        String endTime = requireTime(request.endTime());
        if (toMinutes(startTime) >= toMinutes(endTime)) {
            throw new BadRequestException("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        }
        checkOverlap(schoolId, slot.getId(), startTime, endTime);
        slot.setSlotName(slotName);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slotRepository.save(slot);
        return CalendarDtos.SlotDto.from(slot);
    }

    @DeleteMapping("/slots/{slotId}")
    public Map<String, String> deleteSlot(@AuthenticationPrincipal CurrentUser user, @PathVariable String slotId) {
        UUID schoolId = requireSchool(user);
        Slot slot = slotInSchool(slotId, schoolId);
        long used = calendarRepository.countBySlotId(slot.getId());
        if (used > 0) {
            throw new BadRequestException("Không thể xóa khung giờ này vì đang được sử dụng trong " + used + " lịch học");
        }
        slotRepository.delete(slot);
        return Map.of("message", "Đã xóa khung giờ tiết học");
    }

    /** Migration route: rename slots to "Tiết 1..N" ordered by start time. */
    @PostMapping("/slots/update-names")
    @Transactional
    public Map<String, Object> updateSlotNames(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        List<Slot> slots = slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId);
        Map<String, Integer> order = new LinkedHashMap<>();
        for (Slot slot : slots) {
            String key = slot.getStartTime() + "_" + slot.getEndTime();
            if (!order.containsKey(key)) {
                order.put(key, order.size());
            }
        }
        int updated = 0;
        for (Slot slot : slots) {
            String newName = "Tiết " + (order.get(slot.getStartTime() + "_" + slot.getEndTime()) + 1);
            if (!newName.equals(slot.getSlotName())) {
                slot.setSlotName(newName);
                slotRepository.save(slot);
                updated++;
            }
        }
        return Map.of(
                "message", "Đã cập nhật " + updated + " tiết học",
                "total_slots", slots.size(),
                "updated_slots", updated,
                "unique_time_slots", order.size());
    }

    // ---------- Activities ----------

    @GetMapping("/activities")
    public List<CalendarDtos.ActivityDto> activities(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return activityRepository.findBySchoolIdOrderByActivityNameAsc(schoolId).stream()
                .map(CalendarDtos.ActivityDto::from).toList();
    }

    @PostMapping("/activities")
    public ResponseEntity<CalendarDtos.ActivityDto> createActivity(@AuthenticationPrincipal CurrentUser user,
                                                                   @RequestBody ActivityRequest request) {
        UUID schoolId = requireSchool(user);
        if (isBlank(request.name()) || isBlank(request.description())) {
            throw new BadRequestException("Vui lòng cung cấp tên và mô tả hoạt động");
        }
        Activity activity = new Activity();
        applyActivity(activity, request);
        activity.setSchool(school(schoolId));
        activityRepository.save(activity);
        return ResponseEntity.status(201).body(CalendarDtos.ActivityDto.from(activity));
    }

    @PutMapping("/activities/{activityId}")
    public CalendarDtos.ActivityDto updateActivity(@AuthenticationPrincipal CurrentUser user,
                                                   @PathVariable String activityId,
                                                   @RequestBody ActivityRequest request) {
        UUID schoolId = requireSchool(user);
        if (isBlank(request.name()) || isBlank(request.description())) {
            throw new BadRequestException("Vui lòng cung cấp tên và mô tả hoạt động");
        }
        Activity activity = activityRepository.findById(UUID.fromString(activityId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hoạt động"));
        applyActivity(activity, request);
        activityRepository.save(activity);
        return CalendarDtos.ActivityDto.from(activity);
    }

    @DeleteMapping("/activities/{activityId}")
    public Map<String, String> deleteActivity(@AuthenticationPrincipal CurrentUser user,
                                              @PathVariable String activityId) {
        UUID schoolId = requireSchool(user);
        Activity activity = activityRepository.findById(UUID.fromString(activityId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hoạt động"));
        long used = calendarRepository.countByActivityId(activity.getId());
        if (used > 0) {
            throw new BadRequestException(
                    "Không thể xóa hoạt động này vì đang được sử dụng trong " + used + " tiết học");
        }
        activityRepository.delete(activity);
        return Map.of("message", "Đã xóa hoạt động");
    }

    // ---------- Class calendars ----------

    @GetMapping("/class/{classId}")
    public Map<String, Object> classCalendars(@AuthenticationPrincipal CurrentUser user,
                                              @PathVariable String classId,
                                              @RequestParam(required = false) LocalDate startDate,
                                              @RequestParam(required = false) LocalDate endDate) {
        UUID schoolId = requireSchool(user);
        ClassEntity classEntity = classInSchool(classId, schoolId);
        List<Calendar> calendars = startDate != null && endDate != null
                ? calendarRepository.findByClassEntityIdAndDateBetweenOrderByDateAscSlotStartTimeAsc(
                        classEntity.getId(), startDate, endDate)
                : calendarRepository.findByClassEntityIdOrderByDateAscSlotStartTimeAsc(classEntity.getId());

        Map<LocalDate, List<CalendarDtos.EntryDto>> grouped = new LinkedHashMap<>();
        Map<LocalDate, String> weekdays = new LinkedHashMap<>();
        for (Calendar calendar : calendars) {
            grouped.computeIfAbsent(calendar.getDate(), d -> new ArrayList<>())
                    .add(CalendarDtos.EntryDto.from(calendar));
            weekdays.putIfAbsent(calendar.getDate(), calendar.getWeekday().getDayOfWeek());
        }
        List<CalendarDtos.DateGroupDto> groups = grouped.entrySet().stream()
                .map(entry -> new CalendarDtos.DateGroupDto(
                        entry.getKey().toString(), entry.getKey(), weekdays.get(entry.getKey()), entry.getValue()))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> classInfo = new LinkedHashMap<>();
        classInfo.put("id", classEntity.getId().toString());
        classInfo.put("name", classEntity.getClassName());
        classInfo.put("academic_year", classEntity.getAcademicYear());
        classInfo.put("teacher", CalendarDtos.TeacherBrief.from(classEntity.getTeacher()));
        result.put("class", classInfo);
        result.put("time_slots", slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId).stream()
                .map(CalendarDtos.SlotDto::from).toList());
        result.put("calendars", groups);
        return result;
    }

    /** Upsert one calendar entry; calendarId may be "new" or the id of an existing entry. */
    @PostMapping("/calendar/{calendarId}")
    @Transactional
    public ResponseEntity<CalendarDtos.EntryDto> upsertEntry(@AuthenticationPrincipal CurrentUser user,
                                                             @PathVariable String calendarId,
                                                             @RequestBody EntryRequest request) {
        UUID schoolId = requireSchool(user);
        UpsertResult result = upsertCalendar(schoolId, "new".equals(calendarId) ? null : calendarId, request);
        return ResponseEntity.status(result.created() ? 201 : 200)
                .body(CalendarDtos.EntryDto.from(result.calendar()));
    }

    /** Bulk upsert; only entries of the latest academic year are applied. */
    @PostMapping("/calendar/bulk")
    @Transactional
    public Map<String, Object> bulkUpsert(@AuthenticationPrincipal CurrentUser user,
                                         @RequestBody BulkRequest body) {
        UUID schoolId = requireSchool(user);
        List<BulkEntry> entries = body == null || body.entries() == null ? List.of() : body.entries();
        if (entries.isEmpty()) {
            throw new BadRequestException("Danh sách entries không hợp lệ");
        }
        String latestYear = latestAcademicYear(schoolId);

        int successCount = 0;
        int filteredCount = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            BulkEntry entry = entries.get(i);
            try {
                ClassEntity classEntity = classInSchool(entry.classId(), schoolId);
                if (latestYear != null && !latestYear.equals(classEntity.getAcademicYear())) {
                    filteredCount++;
                    continue;
                }
                if (Boolean.TRUE.equals(entry.delete())) {
                    calendarRepository.findByClassEntityIdAndDateAndSlotId(
                            classEntity.getId(), entry.date(), UUID.fromString(entry.slotId()))
                            .forEach(calendarRepository::delete);
                    successCount++;
                    continue;
                }
                upsertCalendar(schoolId, null, entry.toEntryRequest());
                successCount++;
            } catch (RuntimeException ex) {
                errors.add(Map.of("index", i, "message", ex.getMessage() == null ? "Lỗi không xác định" : ex.getMessage()));
            }
        }
        String message = errors.isEmpty()
                ? (filteredCount > 0
                        ? "Đã áp dụng lịch mặc định thành công. Đã bỏ qua " + filteredCount
                                + " entry không thuộc năm học lớn nhất."
                        : "Đã áp dụng lịch mặc định thành công")
                : "Hoàn thành với một số lỗi";
        return Map.of(
                "message", message,
                "total", entries.size(),
                "success_count", successCount,
                "error_count", errors.size(),
                "filtered_count", filteredCount,
                "errors", errors);
    }

    @DeleteMapping("/calendar/{calendarId}")
    public Map<String, String> deleteEntry(@AuthenticationPrincipal CurrentUser user,
                                           @PathVariable String calendarId) {
        UUID schoolId = requireSchool(user);
        Calendar calendar = calendarRepository.findById(UUID.fromString(calendarId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lịch học"));
        if (!calendar.getClassEntity().getSchool().getId().equals(schoolId)) {
            throw new ForbiddenException("Bạn không có quyền xóa lịch học của lớp thuộc trường khác");
        }
        if (calendar.getDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Không thể xóa lịch của ngày đã qua");
        }
        calendarRepository.delete(calendar);
        return Map.of("message", "Đã xóa tiết học khỏi lịch");
    }

    // ---------- Teachers ----------

    @GetMapping("/teachers")
    public List<Map<String, Object>> teachers(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        List<Teacher> teachers = new ArrayList<>(teacherRepository.findBySchoolId(schoolId));
        teachers.sort(Comparator.comparing(t -> t.getUser().getFullName()));
        return teachers.stream().map(teacher -> {
            User u = teacher.getUser();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", teacher.getId().toString());
            item.put("user_id", u.getId().toString());
            item.put("full_name", u.getFullName());
            item.put("avatar_url", u.getAvatarUrl());
            item.put("email", u.getEmail());
            item.put("specialization", teacher.getMajor() == null ? "" : teacher.getMajor());
            return item;
        }).toList();
    }

    // ---------- Shared upsert ----------

    private record UpsertResult(Calendar calendar, boolean created) {
    }

    private UpsertResult upsertCalendar(UUID schoolId, String calendarId, EntryRequest request) {
        if (isBlank(request.classId()) || request.date() == null
                || isBlank(request.slotId()) || isBlank(request.activityId())) {
            throw new BadRequestException("Vui lòng cung cấp đầy đủ: lớp học, ngày, tiết học và hoạt động");
        }
        ClassEntity classEntity = classInSchool(request.classId(), schoolId);
        Slot slot = slotInSchool(request.slotId(), schoolId);
        Activity activity = activityRepository.findById(UUID.fromString(request.activityId()))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hoạt động"));

        WeekDay weekday = weekDayRepository
                .findByDayOfWeek(WEEKDAY_NAMES.get(request.date().getDayOfWeek().getValue() - 1))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin ngày trong tuần"));

        UUID teacherId = !isBlank(request.teacherId()) ? UUID.fromString(request.teacherId())
                : classEntity.getTeacher() == null ? null : classEntity.getTeacher().getId();
        if (teacherId == null) {
            throw new BadRequestException("Lớp học chưa có giáo viên chủ nhiệm");
        }

        // Same class+date+slot already scheduled → update that entry instead of duplicating.
        Calendar target = calendarId != null
                ? calendarRepository.findById(UUID.fromString(calendarId)).orElse(null)
                : null;
        if (target == null) {
            target = calendarRepository
                    .findByClassEntityIdAndDateAndSlotId(classEntity.getId(), request.date(), slot.getId())
                    .stream().findFirst().orElseGet(Calendar::new);
        }

        // Slot overlap inside the class (excluding the entry being written).
        for (Calendar other : calendarRepository.findByClassEntityIdAndDate(classEntity.getId(), request.date())) {
            if (target.getId() != null && target.getId().equals(other.getId())) {
                continue;
            }
            if (toMinutes(slot.getStartTime()) < toMinutes(other.getSlot().getEndTime())
                    && toMinutes(slot.getEndTime()) > toMinutes(other.getSlot().getStartTime())) {
                throw new BadRequestException("Khung giờ tiết học này bị trùng với một tiết học khác trong ngày của lớp");
            }
        }
        // Teacher must not teach two classes at once.
        for (Calendar other : calendarRepository.findByTeacherIdAndDate(teacherId, request.date())) {
            if (target.getId() != null && target.getId().equals(other.getId())) {
                continue;
            }
            if (toMinutes(slot.getStartTime()) < toMinutes(other.getSlot().getEndTime())
                    && toMinutes(slot.getEndTime()) > toMinutes(other.getSlot().getStartTime())) {
                throw new BadRequestException(
                        "Giáo viên này đã có tiết học khác trong khoảng thời gian này (lớp "
                                + other.getClassEntity().getClassName()
                                + "). Vui lòng chọn giáo viên khác hoặc khung giờ khác.");
            }
        }

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên"));
        target.setClassEntity(classEntity);
        target.setWeekday(weekday);
        target.setDate(request.date());
        target.setSlot(slot);
        target.setActivity(activity);
        boolean created = target.getId() == null;
        calendarRepository.save(target);
        return new UpsertResult(target, created);
    }

    private void checkOverlap(UUID schoolId, UUID excludeSlotId, String startTime, String endTime) {
        for (Slot other : slotRepository.findBySchoolIdOrderByStartTimeAsc(schoolId)) {
            if (excludeSlotId != null && excludeSlotId.equals(other.getId())) {
                continue;
            }
            if (toMinutes(startTime) < toMinutes(other.getEndTime())
                    && toMinutes(endTime) > toMinutes(other.getStartTime())) {
                throw new BadRequestException("Khung giờ này bị trùng với một tiết học khác");
            }
        }
    }

    private String latestAcademicYear(UUID schoolId) {
        return classRepository.findBySchoolIdOrderByClassNameAsc(schoolId).stream()
                .map(ClassEntity::getAcademicYear)
                .distinct()
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.role() != Role.SCHOOL_ADMIN || user.schoolId() == null) {
            throw new ForbiddenException("Chỉ quản trị trường học được thực hiện thao tác này");
        }
        return UUID.fromString(user.schoolId());
    }

    private School school(UUID schoolId) {
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
    }

    private ClassEntity classInSchool(String classId, UUID schoolId) {
        return classRepository.findById(UUID.fromString(classId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
    }

    private Slot slotInSchool(String slotId, UUID schoolId) {
        return slotRepository.findById(UUID.fromString(slotId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khung giờ tiết học"));
    }

    private static void applyActivity(Activity activity, ActivityRequest request) {
        activity.setActivityName(request.name().trim());
        activity.setDescription(request.description().trim());
        activity.setRequireOutdoor(request.requireOutdoor() == null ? 0 : request.requireOutdoor());
    }

    private static String requireName(String name, String message) {
        if (isBlank(name)) {
            throw new BadRequestException(message);
        }
        return name.trim();
    }

    private static String requireTime(String time) {
        if (time == null || !time.matches("\\d{2}:\\d{2}")) {
            throw new BadRequestException("Vui lòng cung cấp giờ bắt đầu và giờ kết thúc");
        }
        return time;
    }

    private static int toMinutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    // ---------- Requests ----------

    public record SlotRequest(String slotName, String startTime, String endTime) {
    }

    public record ActivityRequest(String name, String description, Short requireOutdoor) {
    }

    public record EntryRequest(String classId, LocalDate date, String slotId,
                               String activityId, String teacherId) {
    }

    public record BulkEntry(String classId, LocalDate date, String slotId, String activityId,
                            String teacherId, Boolean delete) {
        EntryRequest toEntryRequest() {
            return new EntryRequest(classId, date, slotId, activityId, teacherId);
        }
    }

    public record BulkRequest(List<BulkEntry> entries) {
    }
}
