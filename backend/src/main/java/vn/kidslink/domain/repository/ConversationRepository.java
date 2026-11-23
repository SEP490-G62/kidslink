package vn.kidslink.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.kidslink.domain.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findFirstByClassEntityIdAndIsClassGroupTrue(UUID classId);

    List<Conversation> findByClassEntityIdAndIsClassGroupFalse(UUID classId);
}
