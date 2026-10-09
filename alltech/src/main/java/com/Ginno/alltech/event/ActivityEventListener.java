package com.Ginno.alltech.event;

import com.Ginno.alltech.dto.activity.ActivityLogResponse;
import com.Ginno.alltech.entity.ActivityLog;
import com.Ginno.alltech.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityEventListener {

    private final ActivityLogRepository activityLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleActivityEvent(ActivityEvent event) {
        log.info("Handling activity event: action={}, entityType={}, entityId={}, user={}",
                event.getAction(), event.getEntityType(), event.getEntityId(), event.getUsername());

        try {
            ActivityLog activityLog = ActivityLog.builder()
                    .userId(event.getUserId())
                    .username(event.getUsername())
                    .action(event.getAction())
                    .entityType(event.getEntityType())
                    .entityId(event.getEntityId())
                    .description(event.getDescription())
                    .createdAt(java.time.LocalDateTime.now())
                    .build();

            ActivityLog savedLog = activityLogRepository.save(activityLog);
            log.info("Successfully persisted activity log ID={}", savedLog.getId());

            ActivityLogResponse response = ActivityLogResponse.builder()
                    .id(savedLog.getId())
                    .userId(savedLog.getUserId())
                    .username(savedLog.getUsername())
                    .action(savedLog.getAction())
                    .entityType(savedLog.getEntityType())
                    .entityId(savedLog.getEntityId())
                    .description(savedLog.getDescription())
                    .createdAt(savedLog.getCreatedAt())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/admin/activity",
                    response
            );
            log.info("Broadcasted activity log ID={} to /topic/admin/activity", savedLog.getId());
        } catch (Exception e) {
            log.error("Failed to persist or broadcast activity log for event: {}", event, e);
        }
    }
}
