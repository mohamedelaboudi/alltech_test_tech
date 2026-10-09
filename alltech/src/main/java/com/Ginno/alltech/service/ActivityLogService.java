package com.Ginno.alltech.service;

import com.Ginno.alltech.dto.activity.ActivityLogResponse;
import com.Ginno.alltech.entity.ActivityLog;
import com.Ginno.alltech.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public Page<ActivityLogResponse> getActivityLogs(Pageable pageable) {

        return activityLogRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    private ActivityLogResponse toResponse(ActivityLog activityLog) {

        return ActivityLogResponse.builder()
                .id(activityLog.getId())
                .userId(activityLog.getUserId())
                .username(activityLog.getUsername())
                .action(activityLog.getAction())
                .entityType(activityLog.getEntityType())
                .entityId(activityLog.getEntityId())
                .description(activityLog.getDescription())
                .createdAt(activityLog.getCreatedAt())
                .build();
    }
}