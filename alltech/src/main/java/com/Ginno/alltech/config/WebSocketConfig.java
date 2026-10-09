package com.Ginno.alltech.config;

import com.Ginno.alltech.security.AuthHandshakeHandler;
import com.Ginno.alltech.security.WebSocketHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig
        implements WebSocketMessageBrokerConfigurer {

    private final WebSocketHandshakeInterceptor webSocketHandshakeInterceptor;
    private final AuthHandshakeHandler authHandshakeHandler;

    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry config
    ) {

        config.enableSimpleBroker("/topic");

        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry
    ) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(webSocketHandshakeInterceptor)
                .setHandshakeHandler(authHandshakeHandler);
    }
}
