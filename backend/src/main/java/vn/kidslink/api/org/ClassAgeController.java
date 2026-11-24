package vn.kidslink.api.org;

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
import vn.kidslink.domain.entity.ClassAge;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.repository.ClassAgeRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.security.CurrentUser;

@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/class-ages")
public class ClassAgeController {

    private final ClassAgeRepository classAgeRepository;
    private final SchoolRepository schoolRepository;

    public ClassAgeController(ClassAgeRepository classAgeRepository, SchoolRepository schoolRepository) {
        this.classAgeRepository = classAgeRepository;
        this.schoolRepository = schoolRepository;
    }

    @GetMapping
    public List<ClassAgeDto> list(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return classAgeRepository.findBySchoolIdOrderByAgeAsc(schoolId).stream()
                .map(ClassAgeDto::from).toList();
    }

    @PostMapping
    public ResponseEntity<ClassAgeDto> create(@AuthenticationPrincipal CurrentUser user,
                                              @RequestBody ClassAgeRequest request) {
        UUID schoolId = requireSchool(user);
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
        ClassAge entity = new ClassAge();
        entity.setAge(request.age());
        entity.setAgeName(request.ageName());
        entity.setSchool(school);
        classAgeRepository.save(entity);
        return ResponseEntity.status(201).body(ClassAgeDto.from(entity));
    }

    @PutMapping("/{id}")
    public ClassAgeDto update(@AuthenticationPrincipal CurrentUser user,
                              @PathVariable String id,
                              @RequestBody ClassAgeRequest request) {
        UUID schoolId = requireSchool(user);
        ClassAge entity = classAgeRepository.findById(UUID.fromString(id))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi"));
        entity.setAge(request.age());
        entity.setAgeName(request.ageName());
        classAgeRepository.save(entity);
        return ClassAgeDto.from(entity);
    }

    @DeleteMapping("/{id}")
    public java.util.Map<String, String> delete(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        ClassAge entity = classAgeRepository.findById(UUID.fromString(id))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi"));
        classAgeRepository.delete(entity);
        return java.util.Map.of("message", "Đã xoá nhóm tuổi");
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }

    public record ClassAgeDto(String id, Integer age, String ageName, String schoolId) {
        public static ClassAgeDto from(ClassAge entity) {
            return new ClassAgeDto(entity.getId().toString(), entity.getAge(), entity.getAgeName(),
                    entity.getSchool().getId().toString());
        }
    }

    public record ClassAgeRequest(Integer age, String ageName) {
    }
}
