package vn.kidslink.api.org;

import java.time.LocalDate;
import java.util.List;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.domain.entity.User;

public record StudentDto(
        String id,
        String fullName,
        String schoolId,
        LocalDate dob,
        Short gender,
        String avatarUrl,
        Short status,
        String allergy,
        String classId,
        String className,
        List<ParentDto> parents) {

    /** Minimal shape (no class / parents loaded). */
    public static StudentDto from(Student student) {
        return from(student, null, List.of());
    }

    public static StudentDto from(Student student, StudentClass studentClass, List<ParentDto> parents) {
        return new StudentDto(
                student.getId().toString(),
                student.getFullName(),
                student.getSchool().getId().toString(),
                student.getDob(),
                student.getGender(),
                student.getAvatarUrl(),
                student.getStatus(),
                student.getAllergy(),
                studentClass == null ? null : studentClass.getClassEntity().getId().toString(),
                studentClass == null ? null : studentClass.getClassEntity().getClassName(),
                parents);
    }

    public record ParentDto(
            String id,
            String userId,
            String relationship,
            UserDto user) {

        public static ParentDto from(Parent parent, String relationship) {
            User user = parent.getUser();
            return new ParentDto(
                    parent.getId().toString(),
                    user.getId().toString(),
                    relationship,
                    UserDto.from(user));
        }
    }
}
