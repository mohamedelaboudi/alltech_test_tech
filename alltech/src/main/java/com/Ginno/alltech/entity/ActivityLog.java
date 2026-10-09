package com.Ginno.alltech.entity;

import com.Ginno.alltech.enums.ActivityAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String username;

    @Enumerated(EnumType.STRING)
    private ActivityAction action;

    private String entityType;

    private Long entityId;

    @Column(length = 1000)
    private String description;

    private LocalDateTime createdAt;
}