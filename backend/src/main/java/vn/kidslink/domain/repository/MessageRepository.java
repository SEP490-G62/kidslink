package vn.kidslink.domain.repository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Message;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    Optional<Message> findFirstByConversationIdOrderBySendAtDesc(UUID conversationId);

    List<Message> findByConversationIdOrderBySendAtAsc(UUID conversationId);

    long countByConversationIdAndReadStatusAndSenderIdNot(UUID conversationId, Short readStatus, UUID senderId);

    long countByConversationIdAndReadStatus(UUID conversationId, Short readStatus);

    void deleteByConversationId(UUID conversationId);
}
