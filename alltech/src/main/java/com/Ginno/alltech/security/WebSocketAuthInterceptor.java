package com.Ginno.alltech.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor != null &&
                StompCommand.CONNECT.equals(accessor.getCommand())) {

            Authentication authentication = resolveAuthentication(accessor);

            if (authentication == null) {
                throw new IllegalArgumentException(
                        "WebSocket CONNECT is not authenticated"
                );
            }

            accessor.setUser(authentication);
        }

        return message;
    }

    private Authentication resolveAuthentication(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (isAuthenticatedUser(user)) {
            return (Authentication) user;
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object principal =
                    sessionAttributes.get(AuthHandshakeHandler.PRINCIPAL_ATTRIBUTE);
            if (isAuthenticatedUser(principal)) {
                return (Authentication) principal;
            }
        }

        return null;
    }

    private boolean isAuthenticatedUser(Object principal) {
        return principal instanceof Authentication authentication
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
