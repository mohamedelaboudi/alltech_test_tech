package com.Ginno.alltech.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class AuthHandshakeHandler extends DefaultHandshakeHandler {

    public static final String PRINCIPAL_ATTRIBUTE = "ws.principal";

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        Object principal = attributes.get(PRINCIPAL_ATTRIBUTE);
        if (principal instanceof Principal user) {
            return user;
        }
        return super.determineUser(request, wsHandler, attributes);
    }
}
