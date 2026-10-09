package com.Ginno.alltech.event;

import com.Ginno.alltech.enums.ActivityAction;
import lombok.Getter;

@Getter
public class ActivityEvent {

    private final Long userId;
    private final String username;
    private final ActivityAction action;
    private final String entityType;
    private final Long entityId;
    private final String description;

    public ActivityEvent(
            Long userId,
            String username,
            ActivityAction action,
            String entityType,
            Long entityId,
            String description
    ) {
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.description = description;
    }
}