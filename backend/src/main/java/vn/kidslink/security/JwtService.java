package vn.kidslink.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import vn.kidslink.domain.Role;

/** Signs and verifies KidsLink JWTs. Payload: {id, role, username, full_name, school_id?}, subject = id. */
@Service
@EnableConfigurationProperties(JwtProperties.class)
public class JwtService {

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(CurrentUser user) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .subject(user.id())
                .claim("id", user.id())
                .claim("role", user.role().getValue())
                .claim("username", user.username())
                .claim("full_name", user.fullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())));
        if (user.schoolId() != null) {
            builder.claim("school_id", user.schoolId());
        }
        return builder.signWith(key).compact();
    }

    /** Throws {@link io.jsonwebtoken.JwtException} when the token is invalid or expired. */
    public CurrentUser parseToken(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new CurrentUser(
                claims.get("id", String.class),
                Role.from(claims.get("role", String.class)),
                claims.get("username", String.class),
                claims.get("full_name", String.class),
                claims.get("school_id", String.class));
    }
}
