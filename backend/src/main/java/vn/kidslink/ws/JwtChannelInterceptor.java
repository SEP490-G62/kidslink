package vn.kidslink.ws;

import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import vn.kidslink.security.JwtService;

/** Authenticates the STOMP session from the {@code Authorization} header sent with the CONNECT frame. */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public JwtChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }
        String auth = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        if (auth == null || auth.isBlank()) {
            throw new MessagingException("Thiếu token xác thực");
        }
        String token = auth.startsWith("Bearer ") ? auth.substring(7).trim() : auth.trim();
        try {
            accessor.setUser(new StompPrincipal(jwtService.parseToken(token).id()));
        } catch (JwtException e) {
            throw new MessagingException("Token không hợp lệ");
        }
        return message;
    }
}
