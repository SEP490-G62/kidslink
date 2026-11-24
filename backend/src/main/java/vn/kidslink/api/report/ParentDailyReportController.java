package vn.kidslink.api.report;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.api.health.HealthDtos;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.repository.DailyReportRepository;
import vn.kidslink.domain.repository.HealthNoticeRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/parent/daily-reports")
public class ParentDailyReportController {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final DailyReportRepository dailyReportRepository;
    private final HealthNoticeRepository healthNoticeRepository;

    public ParentDailyReportController(ParentRepository parentRepository,
                                       ParentStudentRepository parentStudentRepository,
                                       DailyReportRepository dailyReportRepository,
                                       HealthNoticeRepository healthNoticeRepository) {
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.healthNoticeRepository = healthNoticeRepository;
    }

    @GetMapping
    public List<ReportDtos.DailyReportDto> list(@AuthenticationPrincipal CurrentUser user,
                                                @RequestParam(required = false) String studentId,
                                                @RequestParam(required = false) LocalDate from,
                                                @RequestParam(required = false) LocalDate to) {
        if (user == null || user.role() != Role.PARENT) {
            throw new ForbiddenException("Không có quyền truy cập");
        }
        var parent = parentRepository.findByUserId(UUID.fromString(user.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));
        List<UUID> allowedStudents = parentStudentRepository.findByParentId(parent.getId()).stream()
                .map(link -> link.getStudent().getId())
                .toList();
        if (allowedStudents.isEmpty()) {
            return List.of();
        }
        UUID studentUuid;
        if (studentId == null || studentId.isBlank()) {
            studentUuid = allowedStudents.get(0);
        } else {
            studentUuid = ReportDtos.parseId(studentId);
            if (studentUuid == null) {
                throw new BadRequestException("student_id không hợp lệ");
            }
            if (!allowedStudents.contains(studentUuid)) {
                throw new ForbiddenException("Bạn không có quyền xem thông tin học sinh này");
            }
        }

        List<vn.kidslink.domain.entity.DailyReport> reports;
        if (from != null || to != null) {
            LocalDate start = from != null ? from : LocalDate.of(1, 1, 1);
            LocalDate end = to != null ? to : LocalDate.of(9999, 12, 31);
            reports = dailyReportRepository.findByStudentIdAndReportDateBetweenOrderByReportDateAsc(
                    studentUuid, start, end);
        } else {
            reports = dailyReportRepository.findByStudentIdOrderByReportDateDesc(studentUuid);
        }

        // Attach health notices issued the same day as each report (legacy behaviour).
        Map<LocalDate, List<HealthDtos.HealthNoticeDto>> noticesByDay =
                healthNoticeRepository.findByStudentIdOrderByCreatedAtDesc(studentUuid).stream()
                        .collect(Collectors.groupingBy(
                                n -> n.getCreatedAt().atZone(VIETNAM).toLocalDate(),
                                Collectors.mapping(HealthDtos.HealthNoticeDto::from, Collectors.toList())));

        return reports.stream()
                .map(r -> ReportDtos.DailyReportDto.from(r,
                        noticesByDay.getOrDefault(r.getReportDate(), List.of())))
                .toList();
    }
}
