package vn.kidslink.ws;

import java.security.Principal;

/** STOMP principal identified by the JWT user id, so user destinations resolve to /user/{id}/queue/... */
public record StompPrincipal(String name) implements Principal {

    @Override
    public String getName() {
        return name;
    }
}
