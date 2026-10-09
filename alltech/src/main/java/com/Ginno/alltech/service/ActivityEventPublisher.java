package com.Ginno.alltech.service;

import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.ActivityAction;
import com.Ginno.alltech.event.ActivityEvent;
import com.Ginno.alltech.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityEventPublisher {

    private final ApplicationEventPublisher eventPublisher;
    private final CurrentUserService currentUserService;

    public void publish(
            ActivityAction action,
            String entityType,
            Long entityId,
            String description
    ) {
        Long userId = null;
        String username = "SYSTEM";
        try {
            User user = currentUserService.getCurrentUser();
            if (user != null) {
                userId = user.getId();
                username = user.getEmail();
            }
        } catch (Exception e) {
            log.warn("Could not determine current user for activity event: {}", e.getMessage());
        }

        eventPublisher.publishEvent(
                new ActivityEvent(
                        userId,
                        username,
                        action,
                        entityType,
                        entityId,
                        description
                )
        );
    }
}
