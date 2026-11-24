package vn.kidslink.api.messaging;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.Conversation;
import vn.kidslink.domain.entity.ConversationParticipant;
import vn.kidslink.domain.entity.Message;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.ParentStudent;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.domain.entity.Teacher;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.ConversationParticipantRepository;
import vn.kidslink.domain.repository.ConversationRepository;
import vn.kidslink.domain.repository.MessageRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.domain.repository.UserRepository;
import vn.kidslink.security.CurrentUser;

@Service
@Transactional
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentClassRepository studentClassRepository;
    private final TeacherRepository teacherRepository;

    public MessagingService(ConversationRepository conversationRepository,
                            ConversationParticipantRepository participantRepository,
                            MessageRepository messageRepository,
                            UserRepository userRepository,
                            ClassRepository classRepository,
                            ParentRepository parentRepository,
                            ParentStudentRepository parentStudentRepository,
                            StudentClassRepository studentClassRepository,
                            TeacherRepository teacherRepository) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.studentClassRepository = studentClassRepository;
        this.teacherRepository = teacherRepository;
    }

    // ---------- Conversations ----------

    public MessagingDtos.ConversationDto createConversation(CurrentUser user,
                                                            MessagingDtos.CreateConversationRequest request) {
        UUID schoolId = requireSchool(user);
        ClassEntity cls = null;
        if (request.classId() != null && !request.classId().isBlank()) {
            cls = findClassInSchool(request.classId(), schoolId);
        }
        Conversation conversation = new Conversation();
        conversation.setTitle(request.title() == null || request.title().isBlank()
                ? (cls == null ? "Chat" : cls.getClassName() + " - Chat")
                : request.title());
        conversation.setCreateAt(Instant.now());
        conversation.setLastMessageAt(Instant.now());
        conversation.setClassEntity(cls);
        conversation.setIsClassGroup(false);
        conversationRepository.save(conversation);
        addParticipant(conversation, uuid(user));
        return toDto(conversation);
    }

    public List<MessagingDtos.ConversationDto> conversations(CurrentUser user) {
        UUID userId = uuid(user);
        return participantRepository.findByUserId(userId).stream()
                .map(ConversationParticipant::getConversation)
                .sorted(Comparator.comparing(Conversation::getLastMessageAt).reversed())
                .map(this::toDto)
                .toList();
    }

    public MessagingDtos.ConversationDto conversation(CurrentUser user, String conversationId) {
        Conversation conversation = findConversation(conversationId);
        requireParticipant(conversation.getId(), user);
        return toDto(conversation);
    }

    public UserDto.Summary addParticipant(CurrentUser user, String conversationId,
                                          MessagingDtos.AddParticipantRequest request) {
        Conversation conversation = findConversation(conversationId);
        requireParticipant(conversation.getId(), user);
        if (request.userId() == null || request.userId().isBlank()) {
            throw new BadRequestException("Yêu cầu có user_id");
        }
        UUID targetId = UUID.fromString(request.userId());
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));
        if (participantRepository.existsByConversationIdAndUserId(conversation.getId(), targetId)) {
            throw new BadRequestException("Người dùng đã tham gia cuộc trò chuyện này");
        }
        addParticipant(conversation, targetId);
        return UserDto.Summary.from(target);
    }

    // ---------- Messages ----------

    public List<MessagingDtos.MessageDto> messages(CurrentUser user, String conversationId,
                                                   String before, Integer limit) {
        Conversation conversation = findConversation(conversationId);
        requireParticipant(conversation.getId(), user);
        List<Message> messages = messageRepository.findByConversationIdOrderBySendAtAsc(conversation.getId());
        if (before != null && !before.isBlank()) {
            Instant cut = parseInstant(before);
            messages = messages.stream().filter(m -> m.getSendAt().isBefore(cut)).toList();
        }
        int size = limit == null || limit <= 0 ? 50 : limit;
        int from = Math.max(0, messages.size() - size);
        return messages.subList(from, messages.size()).stream()
                .map(MessagingDtos.MessageDto::from)
                .toList();
    }

    public MessagingDtos.MessageDto send(CurrentUser user, MessagingDtos.SendMessageRequest request) {
        return send(uuid(user), request);
    }

    /** Shared by the REST endpoint and the STOMP /message.send handler. */
    public MessagingDtos.MessageDto send(UUID userId, MessagingDtos.SendMessageRequest request) {
        if (request.conversationId() == null || request.conversationId().isBlank()) {
            throw new BadRequestException("Yêu cầu có conversation_id");
        }
        if ((request.content() == null || request.content().isBlank()) && request.imageUrl() == null) {
            throw new BadRequestException("Yêu cầu có nội dung hoặc ảnh");
        }
        Conversation conversation = findConversation(request.conversationId());
        if (!participantRepository.existsByConversationIdAndUserId(conversation.getId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này");
        }
        Message message = new Message();
        message.setContent(request.content() == null ? null : request.content().trim());
        message.setImageUrl(request.imageUrl());
        message.setSendAt(Instant.now());
        message.setReadStatus((short) 0);
        message.setConversation(conversation);
        message.setSender(userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng")));
        messageRepository.save(message);

        conversation.setLastMessageAt(message.getSendAt());
        conversationRepository.save(conversation);
        return MessagingDtos.MessageDto.from(message);
    }

    public Map<String, String> markRead(CurrentUser user, String conversationId) {
        return markRead(uuid(user), conversationId);
    }

    /** Shared by the REST endpoint and the STOMP /message.read handler. */
    public Map<String, String> markRead(UUID userId, String conversationId) {
        Conversation conversation = findConversation(conversationId);
        if (!participantRepository.existsByConversationIdAndUserId(conversation.getId(), userId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập cuộc trò chuyện này");
        }
        messageRepository.findByConversationIdOrderBySendAtAsc(conversation.getId()).stream()
                .filter(m -> !m.getSender().getId().equals(userId) && m.getReadStatus() == 0)
                .forEach(m -> {
                    m.setReadStatus((short) 1);
                    messageRepository.save(m);
                });
        return Map.of("message", "Đánh dấu đã đọc thành công");
    }

    public MessagingDtos.UnreadCountDto unreadCount(CurrentUser user) {
        UUID userId = uuid(user);
        long total = 0;
        List<MessagingDtos.UnreadConversationDto> byConversation = new ArrayList<>();
        for (Conversation conversation : conversationsOf(userId)) {
            long count = messageRepository.countByConversationIdAndReadStatusAndSenderIdNot(
                    conversation.getId(), (short) 0, userId);
            if (count > 0) {
                total += count;
                byConversation.add(new MessagingDtos.UnreadConversationDto(conversation.getId().toString(), count));
            }
        }
        return new MessagingDtos.UnreadCountDto(total, byConversation);
    }

    // ---------- Direct parent-teacher conversation ----------

    public MessagingDtos.ConversationDto direct(CurrentUser user, MessagingDtos.DirectConversationRequest request) {
        if (user.role() != Role.PARENT && user.role() != Role.TEACHER) {
            throw new ForbiddenException("Chỉ phụ huynh hoặc giáo viên mới có quyền tạo trò chuyện riêng");
        }
        ClassEntity cls;
        UUID parentUserId;
        UUID teacherUserId;
        if (user.role() == Role.PARENT) {
            Parent parent = parentRepository.findByUserId(uuid(user))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy phụ huynh"));
            List<UUID> studentIds = parentStudentRepository.findByParentId(parent.getId()).stream()
                    .map(ps -> ps.getStudent().getId()).toList();
            if (request.studentId() != null && !request.studentId().isBlank()) {
                UUID specified = UUID.fromString(request.studentId());
                if (studentIds.contains(specified)) {
                    studentIds = List.of(specified);
                }
            }
            if (studentIds.isEmpty()) {
                throw new NotFoundException("Không tìm thấy học sinh liên kết");
            }
            cls = latestClassOfStudents(studentIds)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp để xác định giáo viên"));
            if (cls.getTeacher() == null || cls.getTeacher().getUser() == null) {
                throw new NotFoundException("Không tìm thấy giáo viên chủ nhiệm");
            }
            teacherUserId = cls.getTeacher().getUser().getId();
            if (request.teacherUserId() != null && !request.teacherUserId().isBlank()) {
                UUID requested = UUID.fromString(request.teacherUserId());
                UUID coTeacherUserId = cls.getCoTeacher() == null || cls.getCoTeacher().getUser() == null
                        ? null : cls.getCoTeacher().getUser().getId();
                if (requested.equals(teacherUserId) || requested.equals(coTeacherUserId)) {
                    teacherUserId = requested;
                }
            }
            parentUserId = uuid(user);
        } else {
            Teacher teacher = teacherRepository.findByUserId(uuid(user))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin giáo viên"));
            cls = latestTeacherClass(teacher.getId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
            teacherUserId = uuid(user);
            if (request.parentUserId() == null || request.parentUserId().isBlank()) {
                throw new BadRequestException("Yêu cầu parent_user_id khi giáo viên tạo conversation");
            }
            parentUserId = UUID.fromString(request.parentUserId());
            parentRepository.findByUserId(parentUserId)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy phụ huynh"));
        }

        // Reuse an existing 1-1 conversation of both users within the same class.
        for (Conversation conversation : sharedConversations(parentUserId, teacherUserId)) {
            if (!Boolean.TRUE.equals(conversation.getIsClassGroup())
                    && conversation.getClassEntity() != null
                    && conversation.getClassEntity().getId().equals(cls.getId())
                    && participantRepository.findByConversationId(conversation.getId()).size() == 2) {
                return toDto(conversation);
            }
        }

        User teacherUser = userRepository.findById(teacherUserId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giáo viên"));
        User parentUser = userRepository.findById(parentUserId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phụ huynh"));
        Conversation conversation = new Conversation();
        conversation.setTitle(parentUser.getFullName() + " - " + teacherUser.getFullName()
                + " - " + cls.getClassName() + " - " + cls.getAcademicYear());
        conversation.setCreateAt(Instant.now());
        conversation.setLastMessageAt(Instant.now());
        conversation.setClassEntity(cls);
        conversation.setIsClassGroup(false);
        conversationRepository.save(conversation);
        addParticipant(conversation, parentUserId);
        addParticipant(conversation, teacherUserId);
        return toDto(conversation);
    }

    // ---------- Teacher / parent lookups ----------

    public MessagingDtos.ClassTeachersDto teachersByStudent(String studentId) {
        ClassEntity cls = latestClassOfStudents(List.of(UUID.fromString(studentId)))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp"));
        List<MessagingDtos.TeacherBriefDto> teachers = new ArrayList<>();
        if (cls.getTeacher() != null && cls.getTeacher().getUser() != null) {
            User u = cls.getTeacher().getUser();
            teachers.add(new MessagingDtos.TeacherBriefDto(
                    cls.getTeacher().getId().toString(), u.getId().toString(),
                    u.getFullName(), u.getAvatarUrl(), "main"));
        }
        if (cls.getCoTeacher() != null && cls.getCoTeacher().getUser() != null) {
            User u = cls.getCoTeacher().getUser();
            teachers.add(new MessagingDtos.TeacherBriefDto(
                    cls.getCoTeacher().getId().toString(), u.getId().toString(),
                    u.getFullName(), u.getAvatarUrl(), "assistant"));
        }
        return new MessagingDtos.ClassTeachersDto(MessagingDtos.ClassInfoDto.from(cls), teachers);
    }

    public MessagingDtos.ClassParentsDto parentsByTeacherClass(CurrentUser user) {
        if (user.role() != Role.TEACHER) {
            throw new ForbiddenException("Chỉ giáo viên mới có quyền xem danh sách phụ huynh");
        }
        Teacher teacher = teacherRepository.findByUserId(uuid(user))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin giáo viên"));
        ClassEntity cls = latestTeacherClass(teacher.getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));

        List<UUID> studentIds = studentClassRepository.findByClassEntityId(cls.getId()).stream()
                .map(sc -> sc.getStudent().getId()).toList();

        Map<UUID, MessagingDtos.ParentBriefDto> parents = new LinkedHashMap<>();
        for (UUID studentId : studentIds) {
            for (ParentStudent ps : parentStudentRepository.findByStudentId(studentId)) {
                Parent parent = ps.getParent();
                User parentUser = parent.getUser();
                if (parentUser == null) {
                    continue;
                }
                MessagingDtos.ParentBriefDto brief = parents.get(parentUser.getId());
                if (brief == null) {
                    List<MessagingDtos.StudentBriefDto> students = new ArrayList<>();
                    students.add(new MessagingDtos.StudentBriefDto(
                            ps.getStudent().getId().toString(),
                            ps.getStudent().getFullName(),
                            ps.getStudent().getAvatarUrl()));
                    brief = new MessagingDtos.ParentBriefDto(
                            parent.getId().toString(), parentUser.getId().toString(),
                            parentUser.getFullName(), parentUser.getAvatarUrl(), students);
                    parents.put(parentUser.getId(), brief);
                } else if (brief.students().stream().noneMatch(
                        s -> s.id().equals(ps.getStudent().getId().toString()))) {
                    List<MessagingDtos.StudentBriefDto> students = new ArrayList<>(brief.students());
                    students.add(new MessagingDtos.StudentBriefDto(
                            ps.getStudent().getId().toString(),
                            ps.getStudent().getFullName(),
                            ps.getStudent().getAvatarUrl()));
                    brief = new MessagingDtos.ParentBriefDto(brief.parentId(), brief.userId(),
                            brief.fullName(), brief.avatarUrl(), students);
                    parents.put(parentUser.getId(), brief);
                }
            }
        }
        return new MessagingDtos.ClassParentsDto(
                MessagingDtos.ClassInfoDto.from(cls), new ArrayList<>(parents.values()));
    }

    // ---------- Class chat group (teacher) ----------

    public MessagingDtos.ConversationDto createClassChatGroup(CurrentUser user,
                                                              MessagingDtos.CreateChatGroupRequest request) {
        if (user.role() != Role.TEACHER) {
            throw new ForbiddenException("Chỉ giáo viên mới có quyền tạo nhóm chat cho lớp");
        }
        Teacher teacher = teacherRepository.findByUserId(uuid(user))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin giáo viên"));
        ClassEntity cls;
        if (request.classId() != null && !request.classId().isBlank()) {
            cls = classRepository.findById(UUID.fromString(request.classId()))
                    .filter(c -> teacher.getId().equals(c.getTeacher() == null ? null : c.getTeacher().getId())
                            || teacher.getId().equals(c.getCoTeacher() == null ? null : c.getCoTeacher().getId()))
                    .orElseThrow(() -> new NotFoundException("Lớp học không tồn tại hoặc bạn không có quyền truy cập"));
        } else {
            cls = latestTeacherClass(teacher.getId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp phù hợp để tạo nhóm"));
        }

        Optional<Conversation> existing = conversationRepository
                .findFirstByClassEntityIdAndIsClassGroupTrue(cls.getId());
        if (existing.isPresent()) {
            if (!participantRepository.existsByConversationIdAndUserId(existing.get().getId(), uuid(user))) {
                addParticipant(existing.get(), uuid(user));
            }
            return toDto(existing.get());
        }

        Conversation conversation = new Conversation();
        conversation.setTitle(request.title() == null || request.title().isBlank()
                ? cls.getClassName() + " - " + cls.getAcademicYear()
                : request.title());
        conversation.setCreateAt(Instant.now());
        conversation.setLastMessageAt(Instant.now());
        conversation.setClassEntity(cls);
        conversation.setIsClassGroup(true);
        conversationRepository.save(conversation);

        Set<UUID> userIds = new HashSet<>();
        if (cls.getTeacher() != null && cls.getTeacher().getUser() != null) {
            userIds.add(cls.getTeacher().getUser().getId());
        }
        if (cls.getCoTeacher() != null && cls.getCoTeacher().getUser() != null) {
            userIds.add(cls.getCoTeacher().getUser().getId());
        }
        for (UUID studentId : studentClassRepository.findByClassEntityId(cls.getId()).stream()
                .map(sc -> sc.getStudent().getId()).toList()) {
            for (ParentStudent ps : parentStudentRepository.findByStudentId(studentId)) {
                if (ps.getParent().getUser() != null) {
                    userIds.add(ps.getParent().getUser().getId());
                }
            }
        }
        for (UUID userId : userIds) {
            addParticipant(conversation, userId);
        }
        return toDto(conversation);
    }

    // ---------- Helpers ----------

    private MessagingDtos.ConversationDto toDto(Conversation conversation) {
        List<ConversationParticipant> parts = participantRepository.findByConversationId(conversation.getId());
        List<UserDto.Summary> participants = parts.stream()
                .map(p -> UserDto.Summary.from(p.getUser()))
                .toList();
        ClassEntity cls = conversation.getClassEntity();
        return new MessagingDtos.ConversationDto(
                conversation.getId().toString(),
                conversation.getTitle(),
                conversation.getCreateAt(),
                conversation.getLastMessageAt(),
                cls == null ? null : cls.getId().toString(),
                cls == null ? null : cls.getClassName(),
                cls == null ? null : cls.getAcademicYear(),
                Boolean.TRUE.equals(conversation.getIsClassGroup()),
                participants.size(),
                participants,
                MessagingDtos.MessageDto.from(messageRepository
                        .findFirstByConversationIdOrderBySendAtDesc(conversation.getId()).orElse(null)));
    }

    private void addParticipant(Conversation conversation, UUID userId) {
        if (participantRepository.existsByConversationIdAndUserId(conversation.getId(), userId)) {
            return;
        }
        ConversationParticipant participant = new ConversationParticipant();
        participant.setConversation(conversation);
        participant.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại")));
        participantRepository.save(participant);
    }

    private List<Conversation> conversationsOf(UUID userId) {
        return participantRepository.findByUserId(userId).stream()
                .map(ConversationParticipant::getConversation)
                .toList();
    }

    private List<Conversation> sharedConversations(UUID userA, UUID userB) {
        Set<UUID> ofA = new HashSet<>();
        conversationsOf(userA).forEach(c -> ofA.add(c.getId()));
        return conversationsOf(userB).stream()
                .filter(c -> ofA.contains(c.getId()))
                .toList();
    }

    private void requireParticipant(UUID conversationId, CurrentUser user) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, uuid(user))) {
            throw new ForbiddenException("Bạn không có quyền truy cập cuộc trò chuyện này");
        }
    }

    private Conversation findConversation(String conversationId) {
        return conversationRepository.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new NotFoundException("Cuộc trò chuyện không tồn tại"));
    }

    private ClassEntity findClassInSchool(String classId, UUID schoolId) {
        return classRepository.findById(UUID.fromString(classId))
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new NotFoundException("Lớp học không tồn tại"));
    }

    private Optional<ClassEntity> latestClassOfStudents(List<UUID> studentIds) {
        return studentIds.stream()
                .flatMap(id -> studentClassRepository.findByStudentId(id).stream())
                .map(StudentClass::getClassEntity)
                .max(Comparator.comparing(ClassEntity::getAcademicYear));
    }

    private Optional<ClassEntity> latestTeacherClass(UUID teacherId) {
        return classRepository.findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(teacherId, teacherId).stream()
                .max(Comparator.comparing(ClassEntity::getAcademicYear));
    }

    private Instant parseInstant(String value) {
        try {
            return Instant.parse(value);
        } catch (Exception e) {
            throw new BadRequestException("Tham số before không hợp lệ");
        }
    }

    private UUID uuid(CurrentUser user) {
        try {
            return UUID.fromString(user.id());
        } catch (IllegalArgumentException e) {
            throw new ForbiddenException("Tài khoản chưa có bản ghi người dùng");
        }
    }

    private UUID requireSchool(CurrentUser user) {
        if (user.schoolId() == null) {
            throw new ForbiddenException("Tài khoản chưa gán trường học");
        }
        return UUID.fromString(user.schoolId());
    }
}
