package vn.kidslink.api.post;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kidslink.common.BadRequestException;
import vn.kidslink.common.ForbiddenException;
import vn.kidslink.common.NotFoundException;
import vn.kidslink.common.UserDto;
import vn.kidslink.domain.Role;
import vn.kidslink.domain.entity.ClassAge;
import vn.kidslink.domain.entity.ClassEntity;
import vn.kidslink.domain.entity.Parent;
import vn.kidslink.domain.entity.ParentStudent;
import vn.kidslink.domain.entity.Post;
import vn.kidslink.domain.entity.PostComment;
import vn.kidslink.domain.entity.PostImage;
import vn.kidslink.domain.entity.PostLike;
import vn.kidslink.domain.entity.StudentClass;
import vn.kidslink.security.CurrentUser;
import vn.kidslink.domain.entity.User;
import vn.kidslink.domain.repository.ClassRepository;
import vn.kidslink.domain.repository.ParentRepository;
import vn.kidslink.domain.repository.ParentStudentRepository;
import vn.kidslink.domain.repository.PostCommentRepository;
import vn.kidslink.domain.repository.PostImageRepository;
import vn.kidslink.domain.repository.PostLikeRepository;
import vn.kidslink.domain.repository.PostRepository;
import vn.kidslink.domain.repository.StudentClassRepository;
import vn.kidslink.domain.repository.TeacherRepository;
import vn.kidslink.domain.repository.UserRepository;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final StudentClassRepository studentClassRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;

    public PostService(PostRepository postRepository,
                        PostImageRepository postImageRepository,
                        PostLikeRepository postLikeRepository,
                        PostCommentRepository postCommentRepository,
                        UserRepository userRepository,
                        ParentRepository parentRepository,
                        ParentStudentRepository parentStudentRepository,
                        StudentClassRepository studentClassRepository,
                        TeacherRepository teacherRepository,
                        ClassRepository classRepository) {
        this.postRepository = postRepository;
        this.postImageRepository = postImageRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.studentClassRepository = studentClassRepository;
        this.teacherRepository = teacherRepository;
        this.classRepository = classRepository;
    }

    // ---------- Feed ----------

    /**
     * School admin: every post of the school (any status).
     * Parent/teacher: approved posts of the school, teacher posts limited to own class scope.
     */
    public List<PostDtos.PostDto> feed(CurrentUser user) {
        UUID schoolId = requireSchool(user);
        Set<UUID> classScope = visibleClassIds(user);
        return postRepository.findBySchool(schoolId).stream()
                .filter(p -> visible(p, user.role(), classScope))
                .map(p -> toDto(p, user))
                .toList();
    }

    public List<PostDtos.PostDto> myPosts(CurrentUser user) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(uuid(user)).stream()
                .map(p -> toDto(p, user))
                .toList();
    }

    private boolean visible(Post post, Role viewerRole, Set<UUID> classScope) {
        if (viewerRole == Role.SCHOOL_ADMIN) {
            return true;
        }
        if (!"approved".equals(post.getStatus())) {
            return false;
        }
        Role author = post.getUser().getRole();
        if (author == Role.SCHOOL_ADMIN || author == Role.PARENT) {
            return true;
        }
        return post.getClassEntity() != null && classScope.contains(post.getClassEntity().getId());
    }

    private Set<UUID> visibleClassIds(CurrentUser user) {
        if (user.role() == Role.TEACHER) {
            UUID teacherId = teacherIdOf(user);
            Set<UUID> ids = new HashSet<>();
            classRepository.findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(teacherId, teacherId)
                    .forEach(c -> ids.add(c.getId()));
            return ids;
        }
        if (user.role() == Role.PARENT) {
            Parent parent = parentRepository.findByUserId(uuid(user))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));
            Set<UUID> ids = new HashSet<>();
            for (ParentStudent ps : parentStudentRepository.findByParentId(parent.getId())) {
                latestClassOfStudent(ps.getStudent().getId()).ifPresent(c -> ids.add(c.getId()));
            }
            return ids;
        }
        return Set.of();
    }

    // ---------- Create ----------

    public PostDtos.PostDto createParentPost(CurrentUser user, PostDtos.CreatePostRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException("Vui lòng nhập nội dung bài viết");
        }
        Parent parent = parentRepository.findByUserId(uuid(user))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin phụ huynh"));
        List<ParentStudent> children = parentStudentRepository.findByParentId(parent.getId());
        if (children.isEmpty()) {
            throw new BadRequestException("Phụ huynh chưa có con học tại trường");
        }
        ClassEntity target;
        if (request.studentId() != null && !request.studentId().isBlank()) {
            UUID studentId = UUID.fromString(request.studentId());
            boolean ownChild = children.stream().anyMatch(ps -> ps.getStudent().getId().equals(studentId));
            if (!ownChild) {
                throw new ForbiddenException("Bạn không có quyền đăng bài cho học sinh này");
            }
            target = latestClassOfStudent(studentId)
                    .orElseThrow(() -> new BadRequestException("Học sinh chưa được phân lớp"));
        } else {
            target = children.stream()
                    .map(ps -> latestClassOfStudent(ps.getStudent().getId()))
                    .flatMap(java.util.Optional::stream)
                    .max(Comparator.comparing(ClassEntity::getAcademicYear))
                    .orElseThrow(() -> new BadRequestException("Không có con nào được phân lớp"));
        }
        return create(user, request.content(), request.images(), target.getId(), "pending");
    }

    public PostDtos.PostDto createTeacherPost(CurrentUser user, PostDtos.CreatePostRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException("Vui lòng nhập nội dung bài viết");
        }
        UUID teacherId = teacherIdOf(user);
        ClassEntity target;
        if (request.classId() != null && !request.classId().isBlank()) {
            target = classRepository.findById(UUID.fromString(request.classId()))
                    .filter(c -> teacherId.equals(c.getTeacher() == null ? null : c.getTeacher().getId())
                            || teacherId.equals(c.getCoTeacher() == null ? null : c.getCoTeacher().getId()))
                    .orElseThrow(() -> new ForbiddenException("Bạn không có quyền đăng bài cho lớp này"));
        } else {
            target = latestTeacherClass(teacherId)
                    .orElseThrow(() -> new BadRequestException("Bạn không phụ trách lớp nào"));
        }
        return create(user, request.content(), request.images(), target.getId(), "approved");
    }

    public PostDtos.PostDto createSchoolAdminPost(CurrentUser user, PostDtos.CreatePostRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException("Nội dung bài đăng là bắt buộc");
        }
        UUID schoolId = requireSchool(user);
        ClassEntity target = null;
        if (request.classId() != null && !request.classId().isBlank()) {
            target = classRepository.findById(UUID.fromString(request.classId()))
                    .filter(c -> c.getSchool().getId().equals(schoolId))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học"));
        }
        return create(user, request.content(), request.images(),
                target == null ? null : target.getId(), "approved");
    }

    private PostDtos.PostDto create(CurrentUser user, String content, List<String> images,
                                    UUID classId, String status) {
        User author = userRepository.findById(uuid(user))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        Post post = new Post();
        post.setContent(content);
        post.setStatus(status);
        post.setUser(author);
        if (classId != null) {
            post.setClassEntity(classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Lớp học không tồn tại")));
        }
        postRepository.save(post);
        saveImages(post, images);
        return toDto(post, user);
    }

    private void saveImages(Post post, List<String> images) {
        if (images == null) {
            return;
        }
        for (String url : images) {
            if (url == null || url.isBlank()) {
                continue;
            }
            PostImage image = new PostImage();
            image.setPost(post);
            image.setImageUrl(url);
            postImageRepository.save(image);
        }
    }

    // ---------- Update / delete / status ----------

    public PostDtos.PostDto update(CurrentUser user, String postId, PostDtos.UpdatePostRequest request) {
        Post post = findPost(postId);
        if (user.role() != Role.SCHOOL_ADMIN && !post.getUser().getId().equals(uuid(user))) {
            throw new ForbiddenException("Bạn không có quyền sửa bài viết này");
        }
        boolean changed = false;
        if (request.content() != null && !request.content().equals(post.getContent())) {
            post.setContent(request.content());
            changed = true;
        }
        if (request.images() != null) {
            postImageRepository.deleteByPostId(post.getId());
            saveImages(post, request.images());
            changed = true;
        }
        // Parent edits go back to pending for re-approval; teacher/school admin stay approved.
        if (changed && user.role() == Role.PARENT) {
            post.setStatus("pending");
        }
        postRepository.save(post);
        return toDto(post, user);
    }

    public void delete(CurrentUser user, String postId) {
        Post post = findPost(postId);
        if (user.role() != Role.SCHOOL_ADMIN && !post.getUser().getId().equals(uuid(user))) {
            throw new ForbiddenException("Bạn không có quyền xóa bài viết này");
        }
        // Images, likes and comments are removed by DB cascade.
        postRepository.delete(post);
    }

    /** School admin approves a post or resets it to pending. */
    public PostDtos.PostDto setStatus(CurrentUser user, String postId, String status) {
        if (!"pending".equals(status) && !"approved".equals(status)) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }
        Post post = findPost(postId);
        post.setStatus(status);
        postRepository.save(post);
        return toDto(post, user);
    }

    // ---------- Likes ----------

    public PostDtos.LikeResultDto toggleLike(CurrentUser user, String postId) {
        Post post = findPost(postId);
        UUID userId = uuid(user);
        postLikeRepository.findByPostIdAndUserId(post.getId(), userId).ifPresentOrElse(
                postLikeRepository::delete,
                () -> {
                    PostLike like = new PostLike();
                    like.setPost(post);
                    like.setUser(userRepository.findById(userId)
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng")));
                    postLikeRepository.save(like);
                });
        return new PostDtos.LikeResultDto(
                postLikeRepository.existsByPostIdAndUserId(post.getId(), userId),
                postLikeRepository.countByPostId(post.getId()));
    }

    public List<UserDto.Summary> likes(String postId) {
        findPost(postId);
        return postLikeRepository.findByPostId(UUID.fromString(postId)).stream()
                .map(like -> UserDto.Summary.from(like.getUser()))
                .toList();
    }

    // ---------- Comments ----------

    public PostDtos.CommentDto addComment(CurrentUser user, String postId, PostDtos.CreateCommentRequest request) {
        Post post = findPost(postId);
        if (request.contents() == null || request.contents().isBlank()) {
            throw new BadRequestException("Nội dung comment là bắt buộc");
        }
        PostComment parent = null;
        if (request.parentCommentId() != null && !request.parentCommentId().isBlank()) {
            parent = postCommentRepository.findById(UUID.fromString(request.parentCommentId()))
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy comment cha"));
        }
        PostComment comment = new PostComment();
        comment.setContents(request.contents().trim());
        comment.setPost(post);
        comment.setUser(userRepository.findById(uuid(user))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng")));
        comment.setParentComment(parent);
        comment.setCreateAt(Instant.now());
        postCommentRepository.save(comment);
        return toFlatDto(comment);
    }

    /** Comment tree for a post: roots newest-first, replies oldest-first inside each node. */
    public List<PostDtos.CommentDto> comments(String postId) {
        findPost(postId);
        List<PostComment> all = postCommentRepository.findByPostIdOrderByCreateAtAsc(UUID.fromString(postId));
        Map<UUID, List<PostComment>> byParent = new HashMap<>();
        List<PostComment> roots = new ArrayList<>();
        for (PostComment c : all) {
            if (c.getParentComment() == null) {
                roots.add(c);
            } else {
                byParent.computeIfAbsent(c.getParentComment().getId(), k -> new ArrayList<>()).add(c);
            }
        }
        roots.sort(Comparator.comparing(PostComment::getCreateAt).reversed());
        return roots.stream().map(root -> buildTree(root, byParent)).toList();
    }

    private PostDtos.CommentDto buildTree(PostComment comment, Map<UUID, List<PostComment>> byParent) {
        List<PostDtos.CommentDto> replies = byParent.getOrDefault(comment.getId(), List.of()).stream()
                .map(child -> buildTree(child, byParent))
                .toList();
        return new PostDtos.CommentDto(
                comment.getId().toString(),
                comment.getContents(),
                comment.getCreateAt(),
                comment.getPost().getId().toString(),
                UserDto.Summary.from(comment.getUser()),
                comment.getParentComment() == null ? null : comment.getParentComment().getId().toString(),
                replies);
    }

    public PostDtos.CommentDto updateComment(CurrentUser user, String commentId, PostDtos.UpdateCommentRequest request) {
        PostComment comment = postCommentRepository.findById(UUID.fromString(commentId))
                .filter(c -> c.getUser().getId().equals(uuid(user)))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy comment hoặc không có quyền chỉnh sửa"));
        if (request.contents() == null || request.contents().isBlank()) {
            throw new BadRequestException("Nội dung comment là bắt buộc");
        }
        comment.setContents(request.contents().trim());
        postCommentRepository.save(comment);
        return toFlatDto(comment);
    }

    /** Delete a comment; direct replies are re-parented to its parent (legacy push-up rule). */
    public void deleteComment(CurrentUser user, String commentId) {
        PostComment comment = postCommentRepository.findById(UUID.fromString(commentId))
                .orElseThrow(() -> new NotFoundException(
                        user.role() == Role.SCHOOL_ADMIN ? "Không tìm thấy bình luận"
                                : "Không tìm thấy comment hoặc không có quyền xóa"));
        if (user.role() != Role.SCHOOL_ADMIN && !comment.getUser().getId().equals(uuid(user))) {
            throw new NotFoundException("Không tìm thấy comment hoặc không có quyền xóa");
        }
        for (PostComment child : postCommentRepository.findByPostIdOrderByCreateAtAsc(comment.getPost().getId())) {
            if (child.getParentComment() != null
                    && child.getParentComment().getId().equals(comment.getId())) {
                child.setParentComment(comment.getParentComment());
                postCommentRepository.save(child);
            }
        }
        postCommentRepository.delete(comment);
    }

    private PostDtos.CommentDto toFlatDto(PostComment comment) {
        return new PostDtos.CommentDto(
                comment.getId().toString(),
                comment.getContents(),
                comment.getCreateAt(),
                comment.getPost().getId().toString(),
                UserDto.Summary.from(comment.getUser()),
                comment.getParentComment() == null ? null : comment.getParentComment().getId().toString(),
                List.of());
    }

    // ---------- Helpers ----------

    private PostDtos.PostDto toDto(Post post, CurrentUser viewer) {
        ClassEntity cls = post.getClassEntity();
        ClassAge age = cls == null ? null : cls.getClassAge();
        UUID viewerId = uuid(viewer);
        return new PostDtos.PostDto(
                post.getId().toString(),
                post.getContent(),
                post.getStatus(),
                post.getCreatedAt(),
                UserDto.Summary.from(post.getUser()),
                cls == null ? null : cls.getId().toString(),
                cls == null ? null : cls.getClassName(),
                age == null ? null : age.getId().toString(),
                cls == null ? null : cls.getAcademicYear(),
                postImageRepository.findByPostId(post.getId()).stream()
                        .map(PostImage::getImageUrl).toList(),
                postLikeRepository.countByPostId(post.getId()),
                postCommentRepository.countByPostId(post.getId()),
                postLikeRepository.existsByPostIdAndUserId(post.getId(), viewerId));
    }

    private Post findPost(String postId) {
        return postRepository.findById(UUID.fromString(postId))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài viết"));
    }

    private java.util.Optional<ClassEntity> latestClassOfStudent(UUID studentId) {
        return studentClassRepository.findByStudentId(studentId).stream()
                .map(StudentClass::getClassEntity)
                .max(Comparator.comparing(ClassEntity::getAcademicYear));
    }

    private java.util.Optional<ClassEntity> latestTeacherClass(UUID teacherId) {
        return classRepository.findByTeacherIdOrCoTeacherIdOrderByClassNameAsc(teacherId, teacherId).stream()
                .max(Comparator.comparing(ClassEntity::getAcademicYear));
    }

    private UUID teacherIdOf(CurrentUser user) {
        return teacherRepository.findByUserId(uuid(user))
                .map(t -> t.getId())
                .orElseThrow(() -> new ForbiddenException("Không tìm thấy thông tin giáo viên"));
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
