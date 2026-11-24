package vn.kidslink.config;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.kidslink.domain.repository.*;

/** Thin access point so the seeder can reach every repository without a 30-argument constructor. */
@Component
public record SeedSupport(
        UserRepository userRepository,
        SchoolRepository schoolRepository,
        ParentRepository parentRepository,
        TeacherRepository teacherRepository,
        HealthCareStaffRepository healthCareStaffRepository,
        ClassAgeRepository classAgeRepository,
        ClassRepository classRepository,
        StudentRepository studentRepository,
        StudentClassRepository studentClassRepository,
        ParentStudentRepository parentStudentRepository,
        WeekDayRepository weekDayRepository,
        SlotRepository slotRepository,
        ActivityRepository activityRepository,
        CalendarRepository calendarRepository,
        MealRepository mealRepository,
        DishRepository dishRepository,
        DishMealRepository dishMealRepository,
        ClassAgeMealRepository classAgeMealRepository,
        DishesClassAgeMealRepository dishesClassAgeMealRepository,
        FeeRepository feeRepository,
        ClassFeeRepository classFeeRepository,
        InvoiceRepository invoiceRepository,
        ComplaintTypeRepository complaintTypeRepository,
        ComplaintTypeCategoryRepository complaintTypeCategoryRepository,
        PostRepository postRepository,
        PostImageRepository postImageRepository,
        PostCommentRepository postCommentRepository,
        PostLikeRepository postLikeRepository,
        ConversationRepository conversationRepository,
        ConversationParticipantRepository conversationParticipantRepository,
        MessageRepository messageRepository,
        HealthRecordRepository healthRecordRepository,
        HealthNoticeRepository healthNoticeRepository,
        PickupRepository pickupRepository,
        PickupStudentRepository pickupStudentRepository,
        PasswordEncoder passwordEncoder) {
}
