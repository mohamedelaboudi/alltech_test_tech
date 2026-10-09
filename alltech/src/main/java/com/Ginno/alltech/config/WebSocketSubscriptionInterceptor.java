package com.Ginno.alltech.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;

public class WebSocketSubscriptionInterceptor
        implements ChannelInterceptor {

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
                StompCommand.SUBSCRIBE.equals(accessor.getCommand()) &&
                "/topic/admin/activity".equals(accessor.getDestination())) {

            if (!(accessor.getUser() instanceof Authentication authentication)) {
                throw new IllegalArgumentException(
                        "Access denied"
                );
            }

            boolean isSuperAdmin =
                    authentication.getAuthorities()
                            .stream()
                            .anyMatch(authority ->
                                    "ROLE_SUPER_ADMIN".equals(
                                            authority.getAuthority()
                                    )
                            );

            if (!isSuperAdmin) {
                throw new IllegalArgumentException(
                        "Access denied"
                );
            }
        }

        return message;
    }
}