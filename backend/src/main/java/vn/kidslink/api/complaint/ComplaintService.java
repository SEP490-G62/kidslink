package vn.kidslink.api.complaint;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.domain.entity.Complaint;
import vn.kidslink.domain.entity.ComplaintType;
import vn.kidslink.domain.entity.ComplaintTypeCategory;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.ComplaintRepository;
import vn.kidslink.domain.repository.ComplaintTypeCategoryRepository;
import vn.kidslink.domain.repository.ComplaintTypeRepository;
import vn.kidslink.domain.repository.SchoolRepository;

/**
 * Logic shared by parent and teacher complaint endpoints (identical apart from the
 * target category and error wording).
 */
@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintTypeRepository complaintTypeRepository;
    private final ComplaintTypeCategoryRepository complaintTypeCategoryRepository;
    private final SchoolRepository schoolRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            ComplaintTypeRepository complaintTypeRepository,
                            ComplaintTypeCategoryRepository complaintTypeCategoryRepository,
                            SchoolRepository schoolRepository) {
        this.complaintRepository = complaintRepository;
        this.complaintTypeRepository = complaintTypeRepository;
        this.complaintTypeCategoryRepository = complaintTypeCategoryRepository;
        this.schoolRepository = schoolRepository;
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.ComplaintTypeDto> typesOfSchool(UUID schoolId, String category) {
        return complaintTypeRepository.findBySchoolIdOrderByNameAsc(schoolId).stream()
                .filter(type -> complaintTypeCategoryRepository.findByComplaintTypeId(type.getId()).stream()
                        .anyMatch(c -> c.getCategory().equals(category)))
                .map(type -> new ComplaintDtos.ComplaintTypeDto(
                        type.getId().toString(), type.getName(), type.getDescription(),
                        categoriesOf(type.getId())))
                .toList();
    }

    @Transactional
    public ComplaintDtos.ComplaintDto create(User user, UUID schoolId, String category,
                                             ComplaintDtos.CreateComplaintRequest request,
                                             String notFoundMessage) {
        if (request.complaintTypeId() == null || request.complaintTypeId().isBlank()) {
            throw new BadRequestException("Vui lòng chọn loại đơn");
        }
        if (request.reason() == null || request.reason().isBlank()) {
            throw new BadRequestException("Vui lòng nhập lý do hoặc nội dung");
        }
        UUID typeId = ComplaintDtos.parseId(request.complaintTypeId());
        ComplaintType type = typeId == null ? null : complaintTypeRepository.findById(typeId)
                .filter(t -> t.getSchool().getId().equals(schoolId))
                .orElse(null);
        if (type == null || !categoriesOf(type.getId()).contains(category)) {
            throw new NotFoundException(notFoundMessage);
        }
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));

        Complaint complaint = new Complaint();
        complaint.setComplaintType(type);
        complaint.setSchool(school);
        complaint.setComplaintTypeName(type.getName().trim());
        complaint.setReason(request.reason().trim());
        complaint.setImage(request.image());
        complaint.setStatus("pending");
        complaint.setUser(user);
        complaintRepository.save(complaint);
        return ComplaintDtos.ComplaintDto.from(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.ComplaintDto> listOwn(UUID userId) {
        return complaintRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ComplaintDtos.ComplaintDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintDetailDto detail(UUID complaintId, User viewer) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn"));
        if (!complaint.getUser().getId().equals(viewer.getId())) {
            throw new ForbiddenException("Bạn không có quyền xem đơn này");
        }
        var type = complaint.getComplaintType();
        return ComplaintDtos.ComplaintDetailDto.from(complaint, new ComplaintDtos.ComplaintTypeDto(
                type.getId().toString(), type.getName(), type.getDescription(), categoriesOf(type.getId())));
    }

    public List<String> categoriesOf(UUID typeId) {
        return complaintTypeCategoryRepository.findByComplaintTypeId(typeId).stream()
                .map(ComplaintTypeCategory::getCategory)
                .toList();
    }
}
