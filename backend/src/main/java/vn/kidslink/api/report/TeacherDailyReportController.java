package vn.kidslink.api.report;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.DailyReport;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.Teacher;
import vn.kidslink.domain.repository.CalendarRepository;
import vn.kidslink.domain.repository.DailyReportRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.StudentRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/teachers")
public class TeacherDailyReportController {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final CalendarRepository calendarRepository;
    private final DailyReportRepository dailyReportRepository;

    public TeacherDailyReportController(TeacherRepository teacherRepository,
                                        StudentRepository studentRepository,
                                        StudentClassRepository studentClassRepository,
                                        CalendarRepository calendarRepository,
                                        DailyReportRepository dailyReportRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.calendarRepository = calendarRepository;
        this.dailyReportRepository = dailyReportRepository;
    }

    @PostMapping("/daily-reports/checkin")
    public ResponseEntity<ReportDtos.DailyReportDto> checkin(@AuthenticationPrincipal CurrentUser user,
                                                             @RequestBody ReportDtos.CheckinRequest request) {
        Teacher teacher = requireTeacher(user);
        Student student = requireActiveStudent(request.studentId());
        LocalDate reportDate = request.reportDate() != null ? request.reportDate() : LocalDate.now(VIETNAM);

        ClassEntity cls = teacherClassForStudent(student.getId(), teacher.getId());
        requireSchedule(cls, reportDate, "Lớp không có lịch học trong ngày đã chọn");

        dailyReportRepository.findByStudentIdAndReportDate(student.getId(), reportDate).ifPresent(existing -> {
            throw new BadRequestException("Học sinh đã được checkin hôm nay");
        });

        DailyReport report = new DailyReport();
        report.setReportDate(reportDate);
        report.setCheckinTime(LocalTime.now(VIETNAM).format(TIME));
        report.setComments("");
        report.setStudent(student);
        report.setTeacherCheckin(teacher);
        dailyReportRepository.save(report);
        return ResponseEntity.status(201).body(ReportDtos.DailyReportDto.from(report));
    }

    @PutMapping("/daily-reports/checkout")
    public ReportDtos.DailyReportDto checkout(@AuthenticationPrincipal CurrentUser user,
                                              @RequestBody ReportDtos.CheckinRequest request) {
        Teacher teacher = requireTeacher(user);
        Student student = requireActiveStudent(request.studentId());
        LocalDate reportDate = request.reportDate() != null ? request.reportDate() : LocalDate.now(VIETNAM);

        ClassEntity cls = teacherClassForStudent(student.getId(), teacher.getId());
        requireSchedule(cls, reportDate, "Lớp không có lịch học trong ngày đã chọn");

        DailyReport report = dailyReportRepository.findByStudentIdAndReportDate(student.getId(), reportDate)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy báo cáo checkin của học sinh hôm nay"));
        if (report.getCheckoutTime() != null) {
            throw new BadRequestException("Học sinh đã được checkout hôm nay");
        }
        report.setCheckoutTime(LocalTime.now(VIETNAM).format(TIME));
        report.setTeacherCheckout(teacher);
        dailyReportRepository.save(report);
        return ReportDtos.DailyReportDto.from(report);
    }

    /**
     * Legacy quirk kept on purpose: {@code id} is either a DailyReport id or a Student id.
     * Student ids auto-create a resting report ("Nghỉ") for today when none exists.
     */
    @PutMapping("/daily-reports/{id}/comment")
    public ResponseEntity<ReportDtos.DailyReportDto> comment(@AuthenticationPrincipal CurrentUser user,
                                                              @PathVariable String id,
                                                              @RequestBody ReportDtos.CommentRequest request) {
        Teacher teacher = requireTeacher(user);
        UUID parsed = ReportDtos.parseId(id);
        if (parsed == null) {
            throw new NotFoundException("Không tìm thấy học sinh!");
        }
        LocalDate today = LocalDate.now(VIETNAM);

        var reportOpt = dailyReportRepository.findById(parsed);
        if (reportOpt.isPresent()) {
            DailyReport report = reportOpt.get();
            if (!report.getReportDate().equals(today)) {
                throw new ForbiddenException("Chỉ được phép nhận xét ngày hôm nay!");
            }
            ClassEntity cls = teacherClassForStudent(report.getStudent().getId(), teacher.getId());
            requireSchedule(cls, report.getReportDate(), "Lớp không có lịch học trong ngày này nên không thể nhận xét");
            report.setComments(request.comments());
            dailyReportRepository.save(report);
            return ResponseEntity.ok(ReportDtos.DailyReportDto.from(report));
        }

        Student student = studentRepository.findById(parsed)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh!"));
        ClassEntity cls = teacherClassForStudent(student.getId(), teacher.getId());
        requireSchedule(cls, today, "Lớp không có lịch học hôm nay nên không thể nhận xét");

        var reportToday = dailyReportRepository.findByStudentIdAndReportDate(student.getId(), today);
        if (reportToday.isPresent()) {
            DailyReport report = reportToday.get();
            report.setComments(request.comments());
            dailyReportRepository.save(report);
            return ResponseEntity.ok(ReportDtos.DailyReportDto.from(report));
        }
        DailyReport report = new DailyReport();
        report.setReportDate(today);
        report.setComments(request.comments() == null || request.comments().isBlank() ? "Nghỉ" : request.comments());
        report.setStudent(student);
        dailyReportRepository.save(report);
        return ResponseEntity.status(201).body(ReportDtos.DailyReportDto.from(report));
    }

    @GetMapping("/students/{studentId}/daily-reports/weekly")
    public List<ReportDtos.DailyReportDto> weekly(@AuthenticationPrincipal CurrentUser user,
                                                 @PathVariable String studentId,
                                                 @RequestParam(required = false) LocalDate weekStart) {
        requireTeacher(user);
        Student student = studentRepository.findById(UUID.fromString(studentId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));

        LocalDate monday = weekStart != null ? weekStart : LocalDate.now(VIETNAM).with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);
        return dailyReportRepository
                .findByStudentIdAndReportDateBetweenOrderByReportDateAsc(student.getId(), monday, sunday)
                .stream()
                .map(ReportDtos.DailyReportDto::from)
                .toList();
    }

    // ---------- Helpers ----------

    private Teacher requireTeacher(CurrentUser user) {
        if (user == null || user.role() != Role.TEACHER) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        return teacherRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin giáo viên"));
    }

    private Student requireActiveStudent(String studentId) {
        if (studentId == null || studentId.isBlank()) {
            throw new BadRequestException("student_id là bắt buộc");
        }
        UUID parsed = ReportDtos.parseId(studentId);
        if (parsed == null) {
            throw new BadRequestException("student_id không hợp lệ");
        }
        Student student = studentRepository.findById(parsed)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học sinh"));
        if (student.getStatus() == null || student.getStatus() != 1) {
            throw new ForbiddenException("Chỉ có thể thao tác với học sinh đang hoạt động");
        }
        return student;
    }

    /** Class of the student taught by this teacher, highest academic year first. */
    private ClassEntity teacherClassForStudent(UUID studentId, UUID teacherId) {
        return studentClassRepository.findByStudentId(studentId).stream()
                .map(sc -> sc.getClassEntity())
                .filter(c -> c != null)
                .filter(c -> (c.getTeacher() != null && c.getTeacher().getId().equals(teacherId))
                        || (c.getCoTeacher() != null && c.getCoTeacher().getId().equals(teacherId)))
                .max(Comparator.comparing(c -> academicYear(c.getAcademicYear())))
                .orElseThrow(() -> new ForbiddenException("Học sinh không thuộc lớp mà bạn phụ trách"));
    }

    private void requireSchedule(ClassEntity cls, LocalDate date, String message) {
        if (!calendarRepository.existsByClassEntityIdAndDate(cls.getId(), date)) {
            throw new BadRequestException(message);
        }
    }

    private int academicYear(String value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.split("-")[0]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
