package vn.kidslink.api.auth;

import java.security.SecureRandom;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ConflictException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UnauthorizedException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.HealthCareStaff;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.Teacher;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.HealthCareStaffRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.security.CurrentUser;
import vn.kidslink.security.JwtService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String ADMIN_ID = "admin";
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final ParentRepository parentRepository;
    private final TeacherRepository teacherRepository;
    private final HealthCareStaffRepository healthCareStaffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.mail.from:no-reply@kidslink.vn}")
    private String mailFrom;

    public AuthService(UserRepository userRepository,
                       SchoolRepository schoolRepository,
                       ParentRepository parentRepository,
                       TeacherRepository teacherRepository,
                       HealthCareStaffRepository healthCareStaffRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.schoolRepository = schoolRepository;
        this.parentRepository = parentRepository;
        this.teacherRepository = teacherRepository;
        this.healthCareStaffRepository = healthCareStaffRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
    }

    @Transactional(readOnly = true)
    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password();

        // Synthetic system admin configured through environment variables (not stored in DB).
        if (!adminUsername.isBlank() && username.equals(adminUsername.trim())) {
            boolean matched = adminPassword != null && !adminPassword.isBlank() && adminPassword.equals(password);
            if (!matched) {
                throw new UnauthorizedException("Sai thông tin đăng nhập");
            }
            UserDto adminDto = new UserDto(ADMIN_ID, "System Admin", adminUsername, "admin",
                    "https://www.vecteezy.com/vector-art/290610-administration-vector-icon",
                    "", "", (short) 1, null, null);
            CurrentUser principal = new CurrentUser(ADMIN_ID, Role.ADMIN, adminUsername, "System Admin", null);
            return new AuthDtos.LoginResponse(jwtService.generateToken(principal), adminDto);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Sai thông tin đăng nhập"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Sai thông tin đăng nhập");
        }

        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new ForbiddenException("Tài khoản đang bị khóa");
        }

        if (user.getSchool() != null) {
            var school = schoolRepository.findById(user.getSchool().getId()).orElse(null);
            if (school == null || school.getStatus() == null || school.getStatus() != 1) {
                throw new ForbiddenException(
                        "Trường học của bạn đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên hệ thống.");
            }
        }

        return new AuthDtos.LoginResponse(jwtService.generateToken(principalOf(user)), UserDto.from(user));
    }

    @Transactional
    public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim();
        String phone = request.phoneNumber().trim();
        Role role = Role.from(request.role());

        if (role == Role.ADMIN) {
            throw new BadRequestException("Không thể đăng ký vai trò admin");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username đã tồn tại");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email đã tồn tại");
        }
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new ConflictException("Số điện thoại đã tồn tại");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setAvatarUrl(request.avatarUrl() == null ? "" : request.avatarUrl().trim());
        user.setStatus((short) 1);
        userRepository.save(user);

        createRoleProfile(user, role);

        return new AuthDtos.LoginResponse(jwtService.generateToken(principalOf(user)), UserDto.from(user));
    }

    @Transactional
    public String forgotPassword(AuthDtos.ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email().trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với email này"));

        String newPassword = generatePassword(10);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        String body = "Xin chào " + user.getFullName() + ",\n\nMật khẩu mới: " + newPassword
                + "\nVui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.";
        sendMail(user.getEmail(), "KidsLink - Mật khẩu mới của bạn", body);

        return "Đã gửi mật khẩu mới tới email của bạn";
    }

    /** Loads the DB-backed caller (used by /users/me when the token belongs to a real user). */
    @Transactional(readOnly = true)
    public User requireUser(CurrentUser principal) {
        if (principal == null || ADMIN_ID.equals(principal.id())) {
            throw new ForbiddenException("Tài khoản quản trị hệ thống không có hồ sơ người dùng");
        }
        return userRepository.findById(UUID.fromString(principal.id()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private void createRoleProfile(User user, Role role) {
        switch (role) {
            case PARENT -> {
                Parent parent = new Parent();
                parent.setUser(user);
                parentRepository.save(parent);
            }
            case TEACHER -> {
                Teacher teacher = new Teacher();
                teacher.setUser(user);
                teacher.setQualification("");
                teacher.setMajor("");
                teacher.setNote("");
                teacher.setExperienceYears(0);
                teacherRepository.save(teacher);
            }
            case HEALTH_CARE_STAFF -> {
                HealthCareStaff staff = new HealthCareStaff();
                staff.setUser(user);
                staff.setQualification("");
                staff.setMajor("");
                staff.setNote("");
                staff.setExperienceYears(0);
                healthCareStaffRepository.save(staff);
            }
            default -> {
                // school_admin / nutrition_staff have no profile table
            }
        }
    }

    private static CurrentUser principalOf(User user) {
        return new CurrentUser(
                user.getId().toString(),
                user.getRole(),
                user.getUsername(),
                user.getFullName(),
                user.getSchool() == null ? null : user.getSchool().getId().toString());
    }

    private void sendMail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (MailException ex) {
            // Never leak SMTP configuration problems to the caller; the password was already reset.
            log.warn("Không gửi được email tới {}: {}", to, ex.getMessage());
        }
    }

    private static String generatePassword(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        String generated = builder.toString();
        // Guarantee the password satisfies the registration policy.
        return "K" + generated.substring(0, 7) + "9!";
    }
}
