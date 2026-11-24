package vn.kidslink.api.nutrition;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kidslink.api.auth.AuthService;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ConflictException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.ClassAgeMeal;
import vn.kidslink.domain.entity.DishesClassAgeMeal;
import vn.kidslink.domain.entity.Dish;
import vn.kidslink.domain.entity.DishMeal;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.Student;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.ClassAgeMealRepository;
import vn.kidslink.domain.repository.ClassAgeRepository;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.DishesClassAgeMealRepository;
import vn.kidslink.domain.repository.DishMealRepository;
import vn.kidslink.domain.repository.DishRepository;
import vn.kidslink.domain.repository.MealRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.domain.repository.WeekDayRepository;
import vn.kidslink.security.CurrentUser;

/**
 * Nutrition staff surface, ported from nutritionController.js: dish CRUD, class/student rosters,
 * weekly menu assignment and profile management.
 */
@RestController
@Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/nutrition")
public class NutritionController {

    private static final List<String> WEEKDAY_ORDER = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");

    private final DishRepository dishRepository;
    private final DishMealRepository dishMealRepository;
    private final MealRepository mealRepository;
    private final WeekDayRepository weekDayRepository;
    private final ClassAgeRepository classAgeRepository;
    private final ClassAgeMealRepository classAgeMealRepository;
    private final DishesClassAgeMealRepository dishesClassAgeMealRepository;
    private final ClassRepository classRepository;
    private final StudentClassRepository studentClassRepository;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public NutritionController(DishRepository dishRepository,
                                DishMealRepository dishMealRepository,
                                MealRepository mealRepository,
                                WeekDayRepository weekDayRepository,
                                ClassAgeRepository classAgeRepository,
                                ClassAgeMealRepository classAgeMealRepository,
                                DishesClassAgeMealRepository dishesClassAgeMealRepository,
                                ClassRepository classRepository,
                                StudentClassRepository studentClassRepository,
                                SchoolRepository schoolRepository,
                                UserRepository userRepository,
                                AuthService authService,
                                PasswordEncoder passwordEncoder) {
        this.dishRepository = dishRepository;
        this.dishMealRepository = dishMealRepository;
        this.mealRepository = mealRepository;
        this.weekDayRepository = weekDayRepository;
        this.classAgeRepository = classAgeRepository;
        this.classAgeMealRepository = classAgeMealRepository;
        this.dishesClassAgeMealRepository = dishesClassAgeMealRepository;
        this.classRepository = classRepository;
        this.studentClassRepository = studentClassRepository;
        this.schoolRepository = schoolRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- Dishes ----------

    @GetMapping("/dishes")
    public List<DishDto> dishes(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        List<Dish> dishes = dishRepository.findBySchoolIdOrderByDishNameAsc(schoolId);
        Map<UUID, List<String>> categories = categoriesByDish(dishes);
        return dishes.stream()
                .map(dish -> DishDto.from(dish, categories.getOrDefault(dish.getId(), List.of())))
                .toList();
    }

    @PostMapping("/dishes")
    @Transactional
    public ResponseEntity<DishDto> createDish(@AuthenticationPrincipal CurrentUser user,
                                              @RequestBody DishRequest request) {
        UUID schoolId = requireSchool(user);
        validateDish(request);
        List<UUID> mealIds = validateMeals(request.category());
        Dish dish = new Dish();
        dish.setDishName(request.dishName().trim());
        dish.setDescription(request.description().trim());
        dish.setSchool(school(schoolId));
        dishRepository.save(dish);
        saveCategories(dish.getId(), mealIds);
        return ResponseEntity.status(201)
                .body(DishDto.from(dish, mealIds.stream().map(UUID::toString).toList()));
    }

    @PutMapping("/dishes/{id}")
    @Transactional
    public DishDto updateDish(@AuthenticationPrincipal CurrentUser user,
                               @PathVariable String id,
                               @RequestBody DishRequest request) {
        UUID schoolId = requireSchool(user);
        if (isBlank(request.dishName()) && isBlank(request.description()) && request.category() == null) {
            throw new BadRequestException("Không có dữ liệu để cập nhật");
        }
        Dish dish = dishInSchool(id, schoolId);
        if (!isBlank(request.dishName())) {
            dish.setDishName(request.dishName().trim());
        }
        if (!isBlank(request.description())) {
            dish.setDescription(request.description().trim());
        }
        List<String> category = null;
        if (request.category() != null) {
            if (request.category().isEmpty()) {
                throw new BadRequestException("category phải là array không rỗng");
            }
            List<UUID> mealIds = validateMeals(request.category());
            dishMealRepository.deleteByDishId(dish.getId());
            saveCategories(dish.getId(), mealIds);
            category = mealIds.stream().map(UUID::toString).toList();
        }
        dishRepository.save(dish);
        Map<UUID, List<String>> categories = categoriesByDish(List.of(dish));
        return DishDto.from(dish, category != null ? category
                : categories.getOrDefault(dish.getId(), List.of()));
    }

    @DeleteMapping("/dishes/{id}")
    @Transactional
    public Map<String, String> deleteDish(@AuthenticationPrincipal CurrentUser user, @PathVariable String id) {
        UUID schoolId = requireSchool(user);
        Dish dish = dishInSchool(id, schoolId);
        dishMealRepository.deleteByDishId(dish.getId());
        dishesClassAgeMealRepository.deleteByDishId(dish.getId());
        dishRepository.delete(dish);
        return Map.of("message", "Đã xoá món ăn");
    }

    // ---------- Rosters ----------

    @GetMapping("/class-ages")
    public List<ClassAgeDto> classAges(@AuthenticationPrincipal CurrentUser user) {
        UUID schoolId = requireSchool(user);
        return classAgeRepository.findBySchoolIdOrderByAgeAsc(schoolId).stream()
                .map(ClassAgeDto::from).toList();
    }

    @GetMapping("/classes")
    public List<ClassDto> classes(@AuthenticationPrincipal CurrentUser user,
                                   @RequestParam(name = "class_age_id", required = false) String classAgeId) {
        UUID schoolId = requireSchool(user);
        return classRepository.findBySchoolIdOrderByClassNameAsc(schoolId).stream()
                .filter(entity -> classAgeId == null || classAgeId.isBlank()
                        || entity.getClassAge().getId().toString().equals(classAgeId))
                .map(ClassDto::from).toList();
    }

    @GetMapping("/classes/{classId}/students")
    public Map<String, Object> classStudents(@AuthenticationPrincipal CurrentUser user,
                                             @PathVariable String classId) {
        UUID schoolId = requireSchool(user);
        var classEntity = classRepository.findById(UUID.fromString(classId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
        List<Map<String, Object>> students = studentsOf(schoolId, classEntity.getId());
        return Map.of(
                "class", ClassDto.from(classEntity),
                "total_students", students.size(),
                "students_with_allergy", countAllergy(students),
                "students", students);
    }

    @GetMapping("/class-ages/{classAgeId}/students")
    public Map<String, Object> classAgeStudents(@AuthenticationPrincipal CurrentUser user,
                                                @PathVariable String classAgeId) {
        UUID schoolId = requireSchool(user);
        var classAge = classAgeRepository.findById(UUID.fromString(classAgeId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhóm tuổi"));
        List<ClassDto> classes = classRepository.findBySchoolIdOrderByClassNameAsc(schoolId).stream()
                .filter(entity -> entity.getClassAge().getId().equals(classAge.getId()))
                .map(ClassDto::from)
                .toList();

        List<Map<String, Object>> classGroups = new ArrayList<>();
        int totalStudents = 0;
        int withAllergy = 0;
        for (ClassDto classDto : classes) {
            List<Map<String, Object>> students = studentsOf(schoolId, UUID.fromString(classDto.id()));
            totalStudents += students.size();
            withAllergy += countAllergy(students);
            Map<String, Object> group = new LinkedHashMap<>();
            group.put("id", classDto.id());
            group.put("class_name", classDto.className());
            group.put("total_students", students.size());
            group.put("students_with_allergy", countAllergy(students));
            group.put("students", students);
            classGroups.add(group);
        }
        return Map.of(
                "class_age", ClassAgeDto.from(classAge),
                "total_classes", classGroups.size(),
                "total_students", totalStudents,
                "students_with_allergy", withAllergy,
                "classes", classGroups);
    }

    // ---------- Meals / weekdays / class-age meals ----------

    @GetMapping("/meals")
    public List<MealDto> meals(@AuthenticationPrincipal CurrentUser user) {
        requireSchool(user);
        return mealRepository.findAllByOrderByMealAsc().stream().map(MealDto::from).toList();
    }

    @GetMapping("/weekdays")
    public List<WeekDayDto> weekdays(@AuthenticationPrincipal CurrentUser user) {
        requireSchool(user);
        return weekDayRepository.findAll().stream()
                .sorted(java.util.Comparator.comparingInt(
                        day -> WEEKDAY_ORDER.indexOf(day.getDayOfWeek())))
                .map(WeekDayDto::from).toList();
    }

    @GetMapping("/class-age-meals")
    public List<ClassAgeMealDto> classAgeMeals(@AuthenticationPrincipal CurrentUser user,
                                               @RequestParam(name = "class_age_id", required = false) String classAgeId,
                                               @RequestParam(name = "meal_id", required = false) String mealId,
                                               @RequestParam(required = false) LocalDate date) {
        UUID schoolId = requireSchool(user);
        List<ClassAgeMeal> all = classAgeMealRepository.findByClassAgeSchoolIdOrderByDateAsc(schoolId);
        return all.stream()
                .filter(cam -> classAgeId == null || classAgeId.isBlank()
                        || cam.getClassAge().getId().toString().equals(classAgeId))
                .filter(cam -> mealId == null || mealId.isBlank()
                        || cam.getMeal().getId().toString().equals(mealId))
                .filter(cam -> date == null || cam.getDate().equals(date))
                .sorted(java.util.Comparator.comparing(ClassAgeMeal::getDate).reversed())
                .map(ClassAgeMealDto::from)
                .toList();
    }

    /** Upsert a class-age meal and replace its dishes. */
    @PostMapping("/class-age-meals/assign")
    @Transactional
    public Map<String, Object> assign(@AuthenticationPrincipal CurrentUser user,
                                      @RequestBody AssignRequest request) {
        UUID schoolId = requireSchool(user);
        if (isBlank(request.classAgeId()) || isBlank(request.mealId())
                || isBlank(request.weekdayId()) || request.date() == null || request.dishIds() == null) {
            throw new BadRequestException("Thiếu tham số yêu cầu");
        }
        var classAge = classAgeRepository.findById(UUID.fromString(request.classAgeId()))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new BadRequestException("Tham chiếu không hợp lệ"));
        var meal = mealRepository.findById(UUID.fromString(request.mealId()))
                .orElseThrow(() -> new BadRequestException("Tham chiếu không hợp lệ"));
        var weekday = weekDayRepository.findById(UUID.fromString(request.weekdayId()))
                .orElseThrow(() -> new BadRequestException("Tham chiếu không hợp lệ"));
        if (request.date().isBefore(LocalDate.now())) {
            throw new BadRequestException("Không thể chỉnh sửa thực đơn của ngày trong quá khứ");
        }
        List<UUID> dishIds = request.dishIds().stream().map(UUID::fromString).distinct().toList();
        if (dishRepository.findAllById(dishIds).size() != dishIds.size()
                || dishIds.stream().anyMatch(dishId -> dishRepository.findById(dishId)
                        .map(d -> !d.getSchool().getId().equals(schoolId)).orElse(true))) {
            throw new BadRequestException("Một số món ăn không hợp lệ hoặc không thuộc trường học của bạn");
        }

        ClassAgeMeal classAgeMeal = classAgeMealRepository
                .findByClassAgeIdAndMealIdAndWeekdayIdAndDate(classAge.getId(), meal.getId(),
                        weekday.getId(), request.date())
                .orElseGet(() -> {
                    ClassAgeMeal created = new ClassAgeMeal();
                    created.setClassAge(classAge);
                    created.setMeal(meal);
                    created.setWeekday(weekday);
                    created.setDate(request.date());
                    return classAgeMealRepository.save(created);
                });
        dishesClassAgeMealRepository.deleteByClassAgeMealId(classAgeMeal.getId());
        for (UUID dishId : dishIds) {
            DishesClassAgeMeal link = new DishesClassAgeMeal();
            link.setClassAgeMeal(classAgeMeal);
            link.setDish(dishRepository.findById(dishId).orElseThrow());
            dishesClassAgeMealRepository.save(link);
        }

        Map<UUID, List<String>> categories = categoriesByDish(dishRepository.findAllById(dishIds));
        return Map.of(
                "success", true,
                "class_age_meal", ClassAgeMealDto.from(classAgeMeal),
                "dishes", dishRepository.findAllById(dishIds).stream()
                        .map(dish -> DishDto.from(dish, categories.getOrDefault(dish.getId(), List.of())))
                        .toList());
    }

    @GetMapping("/class-age-meals/dishes")
    public Map<String, Object> assignedDishes(@AuthenticationPrincipal CurrentUser user,
                                              @RequestParam(name = "class_age_id") String classAgeId,
                                              @RequestParam(name = "meal_id") String mealId,
                                              @RequestParam(name = "weekday_id") String weekdayId,
                                              @RequestParam LocalDate date) {
        UUID schoolId = requireSchool(user);
        classAgeRepository.findById(UUID.fromString(classAgeId))
                .filter(item -> item.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new BadRequestException("Tham chiếu không hợp lệ"));
        mealRepository.findById(UUID.fromString(mealId))
                .orElseThrow(() -> new BadRequestException("Tham chiếu không hợp lệ"));
        return classAgeMealRepository
                .findByClassAgeIdAndMealIdAndWeekdayIdAndDate(UUID.fromString(classAgeId),
                        UUID.fromString(mealId), UUID.fromString(weekdayId), date)
                .map(cam -> Map.<String, Object>of(
                        "class_age_meal_id", cam.getId().toString(),
                        "dishes", dishesOf(schoolId, cam.getId())))
                .orElseGet(() -> Map.of("class_age_meal_id", "", "dishes", List.of()));
    }

    /** All dishes assigned during one week, keyed "classAgeId-mealId-weekdayId". */
    @GetMapping("/class-age-meals/weekly-dishes")
    public Map<String, Object> weeklyDishes(@AuthenticationPrincipal CurrentUser user,
                                            @RequestParam(name = "week_start") LocalDate weekStart,
                                            @RequestParam(name = "class_age_ids", required = false) String classAgeIds,
                                            @RequestParam(name = "meal_ids", required = false) String mealIds,
                                            @RequestParam(name = "weekday_ids", required = false) String weekdayIds) {
        UUID schoolId = requireSchool(user);
        if (weekStart == null) {
            throw new BadRequestException("Thiếu tham số week_start");
        }
        List<UUID> classAgeFilter = idList(classAgeIds);
        List<UUID> mealFilter = idList(mealIds);
        List<UUID> weekdayFilter = idList(weekdayIds);
        LocalDate weekEnd = weekStart.plusDays(6);

        Map<UUID, List<DishesClassAgeMeal>> byCam = new LinkedHashMap<>();
        List<ClassAgeMeal> cams = classAgeMealRepository
                .findByClassAgeSchoolIdOrderByDateAsc(schoolId).stream()
                .filter(cam -> !cam.getDate().isBefore(weekStart) && !cam.getDate().isAfter(weekEnd))
                .filter(cam -> classAgeFilter.isEmpty() || classAgeFilter.contains(cam.getClassAge().getId()))
                .filter(cam -> mealFilter.isEmpty() || mealFilter.contains(cam.getMeal().getId()))
                .filter(cam -> weekdayFilter.isEmpty() || weekdayFilter.contains(cam.getWeekday().getId()))
                .toList();
        if (!cams.isEmpty()) {
            for (DishesClassAgeMeal link : dishesClassAgeMealRepository
                    .findByClassAgeMealIdIn(cams.stream().map(ClassAgeMeal::getId).toList())) {
                byCam.computeIfAbsent(link.getClassAgeMeal().getId(), id -> new ArrayList<>()).add(link);
            }
        }

        Map<String, Object> schedule = new LinkedHashMap<>();
        for (ClassAgeMeal cam : cams) {
            List<Dish> dishes = byCam.getOrDefault(cam.getId(), List.of()).stream()
                    .map(DishesClassAgeMeal::getDish)
                    .filter(dish -> dish.getSchool().getId().equals(schoolId))
                    .toList();
            Map<UUID, List<String>> categories = categoriesByDish(dishes);
            schedule.put(cam.getClassAge().getId() + "-" + cam.getMeal().getId() + "-"
                            + cam.getWeekday().getId(),
                    Map.of(
                            "dishes", dishes.stream()
                                    .map(dish -> DishDto.from(dish,
                                            categories.getOrDefault(dish.getId(), List.of())))
                                    .toList(),
                            "class_age_id", cam.getClassAge().getId().toString(),
                            "meal_id", cam.getMeal().getId().toString(),
                            "weekday_id", cam.getWeekday().getId().toString(),
                            "date", cam.getDate().toString()));
        }
        return Map.of("schedule", schedule);
    }

    // ---------- Profile ----------

    @GetMapping("/profile")
    public Map<String, Object> profile(@AuthenticationPrincipal CurrentUser user) {
        return Map.of("user", UserDto.from(requireNutritionUser(user)));
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@AuthenticationPrincipal CurrentUser user,
                                             @RequestBody ProfileRequest request) {
        User staff = requireNutritionUser(user);
        if (!isBlank(request.fullName())) {
            staff.setFullName(request.fullName().trim());
        }
        if (request.avatarUrl() != null) {
            staff.setAvatarUrl(request.avatarUrl().trim());
        }
        if (!isBlank(request.email())) {
            String email = request.email().trim();
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(staff.getId()))
                    .ifPresent(existing -> {
                        throw new ConflictException("Email đã tồn tại");
                    });
            staff.setEmail(email);
        }
        if (!isBlank(request.phoneNumber())) {
            String phone = request.phoneNumber().trim();
            userRepository.findByPhoneNumber(phone)
                    .filter(existing -> !existing.getId().equals(staff.getId()))
                    .ifPresent(existing -> {
                        throw new ConflictException("Số điện thoại đã tồn tại");
                    });
            staff.setPhoneNumber(phone);
        }
        userRepository.save(staff);
        return Map.of(
                "message", "Cập nhật profile thành công",
                "user", UserDto.from(staff));
    }

    @PutMapping("/change-password")
    public Map<String, String> changePassword(@AuthenticationPrincipal CurrentUser user,
                                              @RequestBody ChangePasswordRequest request) {
        User staff = requireNutritionUser(user);
        if (isBlank(request.currentPassword()) || isBlank(request.newPassword())
                || isBlank(request.confirmPassword())) {
            throw new BadRequestException("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không khớp");
        }
        if (request.newPassword().length() < 6) {
            throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        if (request.newPassword().equals(request.currentPassword())) {
            throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        if (staff.getPasswordHash() == null
                || !passwordEncoder.matches(request.currentPassword(), staff.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        staff.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(staff);
        return Map.of("message", "Đổi mật khẩu thành công");
    }

    // ---------- helpers ----------

    private User requireNutritionUser(CurrentUser user) {
        User staff = authService.requireUser(user);
        if (staff.getRole() != Role.NUTRITION_STAFF) {
            throw new ForbiddenException("Không đúng vai trò nutrition staff");
        }
        return staff;
    }

    private UUID requireSchool(CurrentUser user) {
        if (user == null || user.role() != Role.NUTRITION_STAFF || user.schoolId() == null) {
            throw new ForbiddenException("Chỉ nhân viên dinh dưỡng được thực hiện thao tác này");
        }
        return UUID.fromString(user.schoolId());
    }

    private School school(UUID schoolId) {
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
    }

    private Dish dishInSchool(String id, UUID schoolId) {
        return dishRepository.findById(UUID.fromString(id))
                .filter(dish -> dish.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy món ăn hoặc không có quyền truy cập"));
    }

    private void validateDish(DishRequest request) {
        if (isBlank(request.dishName()) || isBlank(request.description())
                || request.category() == null || request.category().isEmpty()) {
            throw new BadRequestException(
                    "Thiếu dish_name, description hoặc category (phải là array không rỗng)");
        }
    }

    private List<UUID> validateMeals(List<String> category) {
        List<UUID> mealIds = category.stream().map(UUID::fromString).distinct().toList();
        if (mealRepository.findAllById(mealIds).size() != mealIds.size()) {
            throw new BadRequestException("Một số category không hợp lệ");
        }
        return mealIds;
    }

    private void saveCategories(UUID dishId, List<UUID> mealIds) {
        for (UUID mealId : mealIds) {
            DishMeal link = new DishMeal();
            link.setDishId(dishId);
            link.setMealId(mealId);
            dishMealRepository.save(link);
        }
    }

    private Map<UUID, List<String>> categoriesByDish(List<Dish> dishes) {
        if (dishes.isEmpty()) {
            return Map.of();
        }
        Map<UUID, List<String>> result = new LinkedHashMap<>();
        for (DishMeal link : dishMealRepository.findByDishIdIn(
                dishes.stream().map(Dish::getId).toList())) {
            result.computeIfAbsent(link.getDishId(), id -> new ArrayList<>())
                    .add(link.getMealId().toString());
        }
        return result;
    }

    private List<Map<String, Object>> studentsOf(UUID schoolId, UUID classId) {
        return studentClassRepository.findByClassEntityId(classId).stream()
                .map(mapping -> mapping.getStudent())
                .filter(student -> student.getSchool() != null
                        && student.getSchool().getId().equals(schoolId))
                .map(student -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", student.getId().toString());
                    item.put("full_name", student.getFullName());
                    item.put("avatar_url", student.getAvatarUrl());
                    item.put("dob", student.getDob());
                    item.put("gender", student.getGender());
                    item.put("allergy", student.getAllergy() == null ? "" : student.getAllergy());
                    item.put("status", student.getStatus());
                    item.put("school_id", student.getSchool().getId().toString());
                    return item;
                }).toList();
    }

    private long countAllergy(List<Map<String, Object>> students) {
        return students.stream()
                .filter(student -> student.get("allergy") != null
                        && !String.valueOf(student.get("allergy")).isBlank())
                .count();
    }

    private List<DishDto> dishesOf(UUID schoolId, UUID classAgeMealId) {
        List<Dish> dishes = dishesClassAgeMealRepository.findByClassAgeMealId(classAgeMealId).stream()
                .map(DishesClassAgeMeal::getDish)
                .filter(dish -> dish.getSchool().getId().equals(schoolId))
                .toList();
        Map<UUID, List<String>> categories = categoriesByDish(dishes);
        return dishes.stream()
                .map(dish -> DishDto.from(dish, categories.getOrDefault(dish.getId(), List.of())))
                .toList();
    }

    private static List<UUID> idList(String commaSeparated) {
        if (commaSeparated == null || commaSeparated.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(commaSeparated.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .toList();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    // ---------- DTOs ----------

    public record DishDto(String id, String dishName, String description, String schoolId,
                          List<String> category) {
        public static DishDto from(Dish dish, List<String> category) {
            return new DishDto(dish.getId().toString(), dish.getDishName(), dish.getDescription(),
                    dish.getSchool().getId().toString(), category);
        }
    }

    public record ClassAgeDto(String id, Integer age, String ageName, String schoolId) {
        public static ClassAgeDto from(vn.kidslink.domain.entity.ClassAge entity) {
            return new ClassAgeDto(entity.getId().toString(), entity.getAge(), entity.getAgeName(),
                    entity.getSchool().getId().toString());
        }
    }

    public record ClassDto(String id, String className, String academicYear, ClassAgeDto classAge) {
        public static ClassDto from(vn.kidslink.domain.entity.ClassEntity entity) {
            return new ClassDto(entity.getId().toString(), entity.getClassName(),
                    entity.getAcademicYear(), ClassAgeDto.from(entity.getClassAge()));
        }
    }

    public record MealDto(String id, String meal) {
        public static MealDto from(vn.kidslink.domain.entity.Meal entity) {
            return new MealDto(entity.getId().toString(), entity.getMeal());
        }
    }

    public record WeekDayDto(String id, String dayOfWeek) {
        public static WeekDayDto from(vn.kidslink.domain.entity.WeekDay entity) {
            return new WeekDayDto(entity.getId().toString(), entity.getDayOfWeek());
        }
    }

    public record ClassAgeMealDto(String id, LocalDate date, ClassAgeDto classAge,
                                  MealDto meal, WeekDayDto weekday) {
        public static ClassAgeMealDto from(ClassAgeMeal entity) {
            return new ClassAgeMealDto(entity.getId().toString(), entity.getDate(),
                    ClassAgeDto.from(entity.getClassAge()),
                    MealDto.from(entity.getMeal()),
                    WeekDayDto.from(entity.getWeekday()));
        }
    }

    // ---------- Requests ----------

    public record DishRequest(String dishName, String description, List<String> category) {
    }

    public record AssignRequest(String classAgeId, String mealId, String weekdayId,
                                LocalDate date, List<String> dishIds) {
    }

    public record ProfileRequest(String fullName, String avatarUrl, String email, String phoneNumber) {
    }

    public record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {
    }
}
