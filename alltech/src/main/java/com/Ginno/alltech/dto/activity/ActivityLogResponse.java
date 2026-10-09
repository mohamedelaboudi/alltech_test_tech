package com.Ginno.alltech.dto.activity;

import com.Ginno.alltech.enums.ActivityAction;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ActivityLogResponse {

    private Long id;
    private Long userId;
    private String username;
    private ActivityAction action;
    private String entityType;
    private Long entityId;
    private String description;
    private LocalDateTime createdAt;
}