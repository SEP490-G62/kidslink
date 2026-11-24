package vn.kidslink.api.calendar;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import vn.kidslink.domain.entity.Activity;
import vn.kidslink.domain.entity.Calendar;
import vn.kidslink.domain.entity.ClassAge;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.Slot;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.Teacher;

/** DTO records shared by school-admin calendar, teacher and parent endpoints. */
public final class CalendarDtos {

    private CalendarDtos() {
    }

    public record SlotDto(String id, String slotName, String startTime, String endTime) {
        public static SlotDto from(Slot slot) {
            return new SlotDto(slot.getId().toString(), slot.getSlotName(), slot.getStartTime(), slot.getEndTime());
        }
    }

    public record ActivityDto(String id, String name, String description, Short requireOutdoor) {
        public static ActivityDto from(Activity activity) {
            return new ActivityDto(activity.getId().toString(), activity.getActivityName(),
                    activity.getDescription(), activity.getRequireOutdoor());
        }
    }

    public record TeacherBrief(String id, String fullName, String avatarUrl) {
        public static TeacherBrief from(Teacher teacher) {
            if (teacher == null) {
                return null;
            }
            return new TeacherBrief(teacher.getId().toString(),
                    teacher.getUser().getFullName(), teacher.getUser().getAvatarUrl());
        }
    }

    /** One calendar row inside a grouped-by-date slot list. */
    public record EntryDto(String id, String slotId, String slotName, String startTime, String endTime,
                           ActivityDto activity, TeacherBrief teacher) {
        public static EntryDto from(Calendar calendar) {
            Slot slot = calendar.getSlot();
            return new EntryDto(
                    calendar.getId().toString(),
                    slot.getId().toString(),
                    slot.getSlotName(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    ActivityDto.from(calendar.getActivity()),
                    TeacherBrief.from(calendar.getTeacher()));
        }
    }

    public record DateGroupDto(String id, LocalDate date, String weekday, List<EntryDto> slots) {
    }

    public record ClassAgeBrief(String id, Integer age, String ageName) {
        public static ClassAgeBrief from(ClassAge classAge) {
            return new ClassAgeBrief(classAge.getId().toString(), classAge.getAge(), classAge.getAgeName());
        }
    }

    public record ClassBrief(String id, String className, String academicYear, ClassAgeBrief classAge) {
        public static ClassBrief from(ClassEntity entity) {
            return new ClassBrief(entity.getId().toString(), entity.getClassName(),
                    entity.getAcademicYear(), ClassAgeBrief.from(entity.getClassAge()));
        }
    }

    /** discount is only set for teacher class rosters; nutrition student lists pass null. */
    public record StudentBrief(String id, String fullName, String avatarUrl, LocalDate dob, Short gender,
                               Short status, String allergy, BigDecimal discount) {
        public static StudentBrief from(Student student, BigDecimal discount) {
            return new StudentBrief(student.getId().toString(), student.getFullName(), student.getAvatarUrl(),
                    student.getDob(), student.getGender(), student.getStatus(), student.getAllergy(), discount);
        }
    }
}
