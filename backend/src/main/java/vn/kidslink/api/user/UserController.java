package vn.kidslink.api.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.kidslink.api.auth.AuthService;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.School;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.SchoolRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.security.CurrentUser;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UserController(UserRepository userRepository,
                          SchoolRepository schoolRepository,
                          PasswordEncoder passwordEncoder,
                          AuthService authService) {
        this.userRepository = userRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal CurrentUser principal) {
        return UserDto.from(authService.requireUser(principal));
    }

    @PutMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal CurrentUser principal,
                            @RequestBody UpdateProfileRequest request) {
        User user = authService.requireUser(principal);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim();
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new vn.kidslink.common.ConflictException("Email đã tồn tại");
                    });
            user.setEmail(email);
        }
        if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
            String phone = request.phoneNumber().trim();
            userRepository.findByPhoneNumber(phone)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new vn.kidslink.common.ConflictException("Số điện thoại đã tồn tại");
                    });
            user.setPhoneNumber(phone);
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        if (request.address() != null) {
            user.setAddress(request.address().trim());
        }
        userRepository.save(user);
        return UserDto.from(user);
    }

    @PutMapping("/change-password")
    public Map<String, String> changePassword(@AuthenticationPrincipal CurrentUser principal,
                                              @RequestBody ChangePasswordRequest request) {
        User user = authService.requireUser(principal);
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (request.newPassword() == null || request.newPassword().length() < 6) {
            throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return Map.of("message", "Đổi mật khẩu thành công");
    }

    @GetMapping
    public Object list(@AuthenticationPrincipal CurrentUser principal,
                       @RequestParam(required = false) String q,
                       @RequestParam(required = false) String role,
                       @RequestParam(required = false) String schoolId,
                       @RequestParam(required = false) Short status,
                       @RequestParam(defaultValue = "1") int page,
                       @RequestParam(defaultValue = "20") int size) {
        requireAdmin(principal);
        UUID schoolFilter = schoolId == null || schoolId.isBlank() ? null : UUID.fromString(schoolId);
        Role roleFilter = role == null || role.isBlank() ? null : Role.from(role);
        var pageResult = userRepository.search(schoolFilter, roleFilter, status,
                q == null || q.isBlank() ? null : q.trim(),
                PageRequest.of(Math.max(0, page - 1), Math.max(1, Math.min(size, 200))));
        List<UserDto> items = pageResult.getContent().stream().map(UserDto::from).toList();
        return Map.of(
                "items", items,
                "total", pageResult.getTotalElements(),
                "page", page,
                "size", size);
    }

    @GetMapping("/{id}")
    public UserDto get(@AuthenticationPrincipal CurrentUser principal, @PathVariable String id) {
        requireAdmin(principal);
        return UserDto.from(findUser(id));
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<UserDto> create(@AuthenticationPrincipal CurrentUser principal,
                                          @RequestBody CreateUserRequest request) {
        requireAdmin(principal);
        if (userRepository.existsByUsername(request.username())) {
            throw new vn.kidslink.common.ConflictException("Username đã tồn tại");
        }
        if (request.email() != null && !request.email().isBlank() && userRepository.existsByEmail(request.email())) {
            throw new vn.kidslink.common.ConflictException("Email đã tồn tại");
        }
        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(
                request.password() == null || request.password().isBlank() ? "Kidslink@123" : request.password()));
        user.setRole(Role.from(request.role()));
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setAvatarUrl(request.avatarUrl() == null ? "" : request.avatarUrl());
        user.setStatus(request.status() == null ? (short) 1 : request.status());
        if (request.schoolId() != null && !request.schoolId().isBlank()) {
            School school = schoolRepository.findById(UUID.fromString(request.schoolId()))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy trường học"));
            user.setSchool(school);
        }
        userRepository.save(user);
        return ResponseEntity.status(201).body(UserDto.from(user));
    }

    @PutMapping("/{id}")
    public UserDto update(@AuthenticationPrincipal CurrentUser principal,
                          @PathVariable String id,
                          @RequestBody UpdateProfileRequest request) {
        requireAdmin(principal);
        User user = findUser(id);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email().trim());
        }
        if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }
        if (request.role() != null && !request.role().isBlank()) {
            user.setRole(Role.from(request.role()));
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        userRepository.save(user);
        return UserDto.from(user);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public Map<String, String> softDelete(@AuthenticationPrincipal CurrentUser principal, @PathVariable String id) {
        requireAdmin(principal);
        User user = findUser(id);
        user.setStatus((short) 0);
        userRepository.save(user);
        return Map.of("message", "Đã vô hiệu hoá tài khoản");
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}/hard")
    public Map<String, String> hardDelete(@AuthenticationPrincipal CurrentUser principal, @PathVariable String id) {
        requireAdmin(principal);
        userRepository.delete(findUser(id));
        return Map.of("message", "Đã xoá tài khoản");
    }

    @PutMapping("/{id}/restore")
    public UserDto restore(@AuthenticationPrincipal CurrentUser principal, @PathVariable String id) {
        requireAdmin(principal);
        User user = findUser(id);
        user.setStatus((short) 1);
        userRepository.save(user);
        return UserDto.from(user);
    }

    private User findUser(String id) {
        return userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private void requireAdmin(CurrentUser principal) {
        if (principal == null || principal.role() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ quản trị hệ thống được thực hiện thao tác này");
        }
    }

    public record UpdateProfileRequest(
            String fullName,
            @Email(message = "email không hợp lệ") String email,
            String phoneNumber,
            String avatarUrl,
            String address,
            String role,
            Short status) {
    }

    public record CreateUserRequest(
            @NotBlank String fullName,
            @NotBlank String username,
            String password,
            @NotBlank String role,
            String email,
            String phoneNumber,
            String avatarUrl,
            String schoolId,
            Short status) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword) {
    }
}
