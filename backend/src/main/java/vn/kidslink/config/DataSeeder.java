package vn.kidslink.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.*;

/**
 * Seeds a demo preschool so every role has something to look at on a fresh database.
 * Runs only when {@code app.seed.enabled=true} (default) and no users exist yet.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final SeedSupport seed;

    public DataSeeder(SeedSupport seed) {
        this.seed = seed;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seed.userRepository().count() > 0) {
            log.info("Seed skipped: database already contains users");
            return;
        }
        log.info("Seeding KidsLink demo data…");
        new SeedScript(seed).run();
        log.info("Seed finished: {} users", seed.userRepository().count());
    }

    /** Kept in a nested class so the runner stays readable when more demo data is added. */
    static final class SeedScript {

        private final SeedSupport s;

        SeedScript(SeedSupport support) {
            this.s = support;
        }

        void run() {
            School school = school();
            List<WeekDay> weekdays = weekdays();
            List<Slot> slots = slots(school);
            List<Activity> activities = activities(school);
            List<ClassAge> ages = classAges(school);

            User adminUser = user("Admin Trường", "schooladmin", "Admin@123", Role.SCHOOL_ADMIN, school, "admin@kidslink.vn", "0900000001");
            User teacher1User = user("Nguyễn Thu Hà", "teacher1", "Teacher@123", Role.TEACHER, school, "teacher1@kidslink.vn", "0900000002");
            User teacher2User = user("Trần Minh Quân", "teacher2", "Teacher@123", Role.TEACHER, school, "teacher2@kidslink.vn", "0900000003");
            User parent1User = user("Phạm Văn An", "parent1", "Parent@123", Role.PARENT, school, "parent1@kidslink.vn", "0900000004");
            User parent2User = user("Lê Thị Bình", "parent2", "Parent@123", Role.PARENT, school, "parent2@kidslink.vn", "0900000005");
            User nurseUser = user("Đỗ Thị Yến", "nurse1", "Nurse@123", Role.HEALTH_CARE_STAFF, school, "nurse1@kidslink.vn", "0900000006");
            User cookUser = user("Hoàng Văn Cường", "cook1", "Cook@123", Role.NUTRITION_STAFF, school, "cook1@kidslink.vn", "0900000007");

            Parent parent1 = parent(parent1User);
            Parent parent2 = parent(parent2User);
            Teacher teacher1 = teacher(teacher1User, "Cử nhân Sư phạm Mầm non", "Giáo dục mầm non", 6);
            Teacher teacher2 = teacher(teacher2User, "Cao đẳng Sư phạm", "Giáo dục mầm non", 3);
            HealthCareStaff nurse = healthStaff(nurseUser, "Điều dưỡng", "Y tế cộng đồng", 4);

            var schoolClass = schoolClass(school, ages.get(0), teacher1, "Lớp 3 tuổi A", "2025-2026");

            List<Student> students = new ArrayList<>();
            students.add(student(school, "Nguyễn Gia Hân", LocalDate.of(2022, 3, 12), (short) 1));
            students.add(student(school, "Phạm Minh Khang", LocalDate.of(2022, 7, 5), (short) 0));
            students.add(student(school, "Trần Bảo Nam", LocalDate.of(2021, 11, 20), (short) 0));
            students.add(student(school, "Lê Ngọc Mai", LocalDate.of(2021, 9, 2), (short) 1));

            linkParent(parent1, students.get(0), "father");
            linkParent(parent1, students.get(2), "father");
            linkParent(parent2, students.get(1), "mother");
            linkParent(parent2, students.get(3), "mother");

            students.forEach(student -> enroll(schoolClass, student, BigDecimal.ZERO));

            calendar(schoolClass, teacher1, weekdays, slots, activities, LocalDate.of(2025, 11, 3));
            meals(school, ages, weekdays);
            dishes(school);
            fee(school, schoolClass, students);
            complaintTypes(school);
            posts(adminUser, teacher1User, parent1User, schoolClass, students);
            conversation(schoolClass, teacher1User, parent1User, parent2User);
            health(nurse, students);
            pickups(students);

            log.debug("Seeded school {} with {} students", school.getSchoolName(), students.size());
        }

        // ---------- builders ----------

        private School school() {
            School school = new School();
            school.setSchoolName("Trường Mầm non KidsLink");
            school.setAddress("Số 12 Nguyễn Du, Hai Bà Trưng, Hà Nội");
            school.setPhone("0241234567");
            school.setEmail("contact@kidslink.vn");
            school.setLogoUrl("https://picsum.photos/seed/kidslink/300");
            school.setStatus((short) 1);
            school.setPayosActive(false);
            return s.schoolRepository().save(school);
        }

        private User user(String fullName, String username, String rawPassword, Role role,
                          School school, String email, String phone) {
            User user = new User();
            user.setFullName(fullName);
            user.setUsername(username);
            user.setPasswordHash(s.passwordEncoder().encode(rawPassword));
            user.setRole(role);
            user.setSchool(school);
            user.setEmail(email);
            user.setPhoneNumber(phone);
            user.setAvatarUrl("https://picsum.photos/seed/" + username + "/200");
            user.setStatus((short) 1);
            return s.userRepository().save(user);
        }

        private Parent parent(User user) {
            Parent parent = new Parent();
            parent.setUser(user);
            return s.parentRepository().save(parent);
        }

        private Teacher teacher(User user, String qualification, String major, int years) {
            Teacher teacher = new Teacher();
            teacher.setUser(user);
            teacher.setQualification(qualification);
            teacher.setMajor(major);
            teacher.setExperienceYears(years);
            teacher.setNote("");
            return s.teacherRepository().save(teacher);
        }

        private HealthCareStaff healthStaff(User user, String qualification, String major, int years) {
            HealthCareStaff staff = new HealthCareStaff();
            staff.setUser(user);
            staff.setQualification(qualification);
            staff.setMajor(major);
            staff.setExperienceYears(years);
            staff.setNote("");
            return s.healthCareStaffRepository().save(staff);
        }

        private List<ClassAge> classAges(School school) {
            List<ClassAge> list = new ArrayList<>();
            list.add(classAge(school, 3, "Nhóm 3 tuổi"));
            list.add(classAge(school, 4, "Nhóm 4 tuổi"));
            list.add(classAge(school, 5, "Nhóm 5 tuổi"));
            return list;
        }

        private ClassAge classAge(School school, int age, String name) {
            ClassAge classAge = new ClassAge();
            classAge.setAge(age);
            classAge.setAgeName(name);
            classAge.setSchool(school);
            return s.classAgeRepository().save(classAge);
        }

        private ClassEntity schoolClass(School school, ClassAge age, Teacher teacher, String name, String year) {
            ClassEntity entity = new ClassEntity();
            entity.setClassName(name);
            entity.setAcademicYear(year);
            entity.setSchool(school);
            entity.setClassAge(age);
            entity.setTeacher(teacher);
            entity.setStartDate(LocalDate.of(2025, 9, 5));
            entity.setEndDate(LocalDate.of(2026, 5, 30));
            return s.classRepository().save(entity);
        }

        private Student student(School school, String name, LocalDate dob, Short gender) {
            Student student = new Student();
            student.setFullName(name);
            student.setSchool(school);
            student.setDob(dob);
            student.setGender(gender);
            student.setAvatarUrl("https://picsum.photos/seed/" + name.hashCode() + "/200");
            student.setStatus((short) 1);
            student.setAllergy("");
            return s.studentRepository().save(student);
        }

        private void linkParent(Parent parent, Student student, String relationship) {
            ParentStudent link = new ParentStudent();
            link.setParent(parent);
            link.setStudent(student);
            link.setRelationship(relationship);
            s.parentStudentRepository().save(link);
        }

        private void enroll(ClassEntity schoolClass, Student student, BigDecimal discount) {
            StudentClass sc = new StudentClass();
            sc.setStudent(student);
            sc.setClassEntity(schoolClass);
            sc.setDiscount(discount);
            s.studentClassRepository().save(sc);
        }

        private List<WeekDay> weekdays() {
            List<WeekDay> days = new ArrayList<>();
            for (String day : List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")) {
                WeekDay weekday = new WeekDay();
                weekday.setDayOfWeek(day);
                days.add(s.weekDayRepository().save(weekday));
            }
            return days;
        }

        private List<Slot> slots(School school) {
            List<Slot> list = new ArrayList<>();
            list.add(slot(school, "Tiết 1", "07:30", "08:30"));
            list.add(slot(school, "Tiết 2", "08:45", "09:45"));
            list.add(slot(school, "Tiết 3", "10:00", "11:00"));
            list.add(slot(school, "Buổi chiều 1", "14:00", "15:00"));
            return list;
        }

        private Slot slot(School school, String name, String start, String end) {
            Slot slot = new Slot();
            slot.setSlotName(name);
            slot.setStartTime(start);
            slot.setEndTime(end);
            slot.setSchool(school);
            return s.slotRepository().save(slot);
        }

        private List<Activity> activities(School school) {
            List<Activity> list = new ArrayList<>();
            list.add(activity(school, "Học bài hát", "Hát và vận động theo nhạc", (short) 0));
            list.add(activity(school, "Tạo hình", "Vẽ, nặn và cắt dán", (short) 0));
            list.add(activity(school, "Vận động ngoài trời", "Chạy nhảy, chơi trò chơi dân gian", (short) 1));
            list.add(activity(school, "Kể chuyện", "Nghe kể chuyện và kể lại", (short) 0));
            return list;
        }

        private Activity activity(School school, String name, String description, Short outdoor) {
            Activity activity = new Activity();
            activity.setActivityName(name);
            activity.setDescription(description);
            activity.setRequireOutdoor(outdoor);
            activity.setSchool(school);
            return s.activityRepository().save(activity);
        }

        private void calendar(ClassEntity schoolClass, Teacher teacher, List<WeekDay> weekdays,
                              List<Slot> slots, List<Activity> activities, LocalDate weekStart) {
            for (int dayOffset = 0; dayOffset < weekdays.size(); dayOffset++) {
                WeekDay weekday = weekdays.get(dayOffset);
                LocalDate date = weekStart.plusDays(dayOffset);
                for (Slot slot : slots) {
                    Calendar entry = new Calendar();
                    entry.setClassEntity(schoolClass);
                    entry.setWeekday(weekday);
                    entry.setDate(date);
                    entry.setSlot(slot);
                    entry.setActivity(activities.get((dayOffset + slot.getSlotName().length()) % activities.size()));
                    entry.setTeacher(teacher);
                    s.calendarRepository().save(entry);
                }
            }
        }

        private void meals(School school, List<ClassAge> ages, List<WeekDay> weekdays) {
            List<Meal> meals = new ArrayList<>();
            for (String name : List.of("Bữa sáng", "Bữa trưa", "Bữa xế")) {
                Meal meal = new Meal();
                meal.setMeal(name);
                meals.add(s.mealRepository().save(meal));
            }
            List<Dish> dishes = dishes(school);
            for (ClassAge age : ages) {
                int index = 0;
                for (WeekDay weekday : weekdays) {
                    for (Meal meal : meals) {
                        ClassAgeMeal menu = new ClassAgeMeal();
                        menu.setClassAge(age);
                        menu.setMeal(meal);
                        menu.setWeekday(weekday);
                        menu.setDate(LocalDate.of(2025, 11, 3).plusDays(index % 5));
                        s.classAgeMealRepository().save(menu);

                        DishesClassAgeMeal link = new DishesClassAgeMeal();
                        link.setClassAgeMeal(menu);
                        link.setDish(dishes.get(index % dishes.size()));
                        s.dishesClassAgeMealRepository().save(link);
                        index++;
                    }
                }
            }
        }

        private List<Dish> dishes(School school) {
            String[][] data = {
                    {"Cháo yến mạch", "Cháo yến mạch sữa tươi, giàu dinh dưỡng"},
                    {"Cơm gạo lứt cá hồi", "Cơm gạo lứt, cá hồi áp chảo, rau luộc"},
                    {"Súp bí đỏ", "Súp bí đỏ thơm ngon, bổ sung vitamin A"},
                    {"Bánh flan trứng", "Bánh flan mềm mịn cho bữa xế"},
                    {"Phở gà", "Phở gà nước dùng thanh ngọt"},
            };
            List<Meal> meals = s.mealRepository().findAllByOrderByMealAsc();
            List<Dish> result = new ArrayList<>();
            for (String[] row : data) {
                Dish dish = new Dish();
                dish.setDishName(row[0]);
                dish.setDescription(row[1]);
                dish.setSchool(school);
                Dish saved = s.dishRepository().save(dish);
                for (Meal meal : meals) {
                    DishMeal link = new DishMeal();
                    link.setDishId(saved.getId());
                    link.setMealId(meal.getId());
                    s.dishMealRepository().save(link);
                }
                result.add(saved);
            }
            return result;
        }

        private void fee(School school, ClassEntity schoolClass, List<Student> students) {
            Fee fee = new Fee();
            fee.setSchool(school);
            fee.setFeeName("Học phí tháng 11");
            fee.setDescription("Học phí và tiền ăn tháng 11/2025");
            fee.setAmount(new BigDecimal("3500000"));
            fee.setLateFeeType("percentage");
            fee.setLateFeeValue(new BigDecimal("5"));
            fee.setLateFeeDescription("Phí trễ hạn 5%");
            Fee saved = s.feeRepository().save(fee);

            ClassFee classFee = new ClassFee();
            classFee.setClassEntity(schoolClass);
            classFee.setFee(saved);
            classFee.setDueDate(LocalDate.of(2025, 11, 15));
            classFee.setNote("Nộp trước ngày 15/11");
            classFee.setStatus((short) 1);
            ClassFee savedClassFee = s.classFeeRepository().save(classFee);

            for (int i = 0; i < students.size(); i++) {
                var studentClass = s.studentClassRepository()
                        .findByStudent_IdAndClassEntityId(students.get(i).getId(), schoolClass.getId())
                        .orElseThrow();
                Invoice invoice = new Invoice();
                invoice.setClassFee(savedClassFee);
                BigDecimal discount = BigDecimal.ZERO;
                BigDecimal amount = saved.getAmount().multiply(BigDecimal.ONE.subtract(
                        discount.divide(new BigDecimal("100"))));
                invoice.setAmountDue(amount);
                invoice.setDueDate(classFee.getDueDate());
                invoice.setStudentClass(studentClass);
                invoice.setDiscount(discount);
                invoice.setStatus(i == 0 ? (short) 1 : (short) 0);
                s.invoiceRepository().save(invoice);
            }
        }

        private void complaintTypes(School school) {
            String[][] data = {
                    {"Điều kiện vệ sinh", "Phản ánh về vệ sinh lớp học, nhà vệ sinh"},
                    {"Chất lượng bữa ăn", "Phản ánh về thực đơn, khẩu phần ăn"},
                    {"Thái độ giáo viên", "Phản ánh về thái độ, tác phong sư phạm"},
                    {"Cơ sở vật chất", "Phản ánh hỏng hóc trang thiết bị"},
            };
            for (String[] row : data) {
                ComplaintType type = new ComplaintType();
                type.setSchool(school);
                type.setName(row[0]);
                type.setDescription(row[1]);
                s.complaintTypeRepository().save(type);
                for (String category : List.of("teacher", "parent")) {
                    ComplaintTypeCategory link = new ComplaintTypeCategory();
                    link.setComplaintTypeId(type.getId());
                    link.setCategory(category);
                    s.complaintTypeCategoryRepository().save(link);
                }
            }
        }

        private void posts(User admin, User teacher, User parent, ClassEntity schoolClass, List<Student> students) {
            Post post1 = post(teacher, schoolClass, "Hôm nay các con đã hoàn thành tiết học tạo hình với chủ đề \"Mùa thu\". Bé nào cũng rất hào hứng!", "approved");
            Post post2 = post(parent, schoolClass, "Cháu nhà mình tối qua kể rất nhiều về tiết học vận động ngoài trời. Cảm ơn cô!", "approved");
            Post post3 = post(admin, null, "Nhà trường thông báo: ngày 20/11 tổ chức lễ kỷ niệm Ngày Nhà giáo Việt Nam tại sân trường.", "approved");

            comment(post1, parent, "Thật tuyệt vời! Bé nhà em cũng rất thích.");
            comment(post1, teacher, "Cảm ơn phụ huynh đã theo dõi.");
            like(post1, parent);
            like(post2, teacher);
            like(post3, parent);

            for (Post post : List.of(post1, post2, post3)) {
                PostImage image = new PostImage();
                image.setPost(post);
                image.setImageUrl("https://picsum.photos/seed/" + post.getId() + "/800/500");
                s.postImageRepository().save(image);
            }
            log.debug("Seeded posts for class {}", schoolClass.getClassName());
            post2.getStatus();
            students.size();
        }

        private Post post(User author, ClassEntity schoolClass, String content, String status) {
            Post post = new Post();
            post.setContent(content);
            post.setStatus(status);
            post.setUser(author);
            post.setClassEntity(schoolClass);
            return s.postRepository().save(post);
        }

        private void comment(Post post, User author, String contents) {
            PostComment comment = new PostComment();
            comment.setPost(post);
            comment.setUser(author);
            comment.setContents(contents);
            comment.setCreateAt(Instant.now());
            s.postCommentRepository().save(comment);
        }

        private void like(Post post, User author) {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(author);
            s.postLikeRepository().save(like);
        }

        private void conversation(ClassEntity schoolClass, User teacher, User... parents) {
            Conversation conversation = new Conversation();
            conversation.setTitle("Nhóm chat " + schoolClass.getClassName());
            conversation.setCreateAt(Instant.now());
            conversation.setLastMessageAt(Instant.now());
            conversation.setClassEntity(schoolClass);
            conversation.setIsClassGroup(true);
            Conversation saved = s.conversationRepository().save(conversation);

            List<User> members = new ArrayList<>();
            members.add(teacher);
            members.addAll(List.of(parents));
            for (User member : members) {
                ConversationParticipant participant = new ConversationParticipant();
                participant.setConversation(saved);
                participant.setUser(member);
                s.conversationParticipantRepository().save(participant);
            }

            Message message = new Message();
            message.setConversation(saved);
            message.setSender(teacher);
            message.setContent("Chào các phụ huynh, hôm nay lớp mình học tạo hình nhé!");
            message.setSendAt(Instant.now());
            message.setReadStatus((short) 0);
            s.messageRepository().save(message);
        }

        private void health(HealthCareStaff nurse, List<Student> students) {
            for (Student student : students) {
                HealthRecord record = new HealthRecord();
                record.setCheckupDate(LocalDate.of(2025, 9, 15));
                record.setHeightCm(new BigDecimal("98.5"));
                record.setWeightKg(new BigDecimal("15.2"));
                record.setNote("Sức khoẻ tốt");
                record.setStudent(student);
                record.setHealthCareStaff(nurse);
                s.healthRecordRepository().save(record);
            }

            HealthNotice notice = new HealthNotice();
            notice.setStudent(students.get(0));
            notice.setSymptoms("Sốt nhẹ 37.8°C, ho");
            notice.setActionsTaken("Đo thân nhiệt, cho uống nước, theo dõi");
            notice.setMedications("Không dùng thuốc");
            notice.setNoticeTime("09:30");
            notice.setNote("Đã thông báo phụ huynh");
            notice.setHealthCareStaff(nurse);
            s.healthNoticeRepository().save(notice);
        }

        private void pickups(List<Student> students) {
            for (int i = 0; i < students.size(); i++) {
                Pickup pickup = new Pickup();
                pickup.setFullName(i % 2 == 0 ? "Phạm Văn An" : "Lê Thị Bình");
                pickup.setRelationship(i % 2 == 0 ? "father" : "mother");
                pickup.setIdCardNumber("00109000" + (10 + i));
                pickup.setPhone("090000001" + i);
                pickup.setAvatarUrl("https://picsum.photos/seed/pickup" + i + "/200");
                Pickup saved = s.pickupRepository().save(pickup);

                PickupStudent link = new PickupStudent();
                link.setPickup(saved);
                link.setStudent(students.get(i));
                s.pickupStudentRepository().save(link);
            }
        }
    }
}
