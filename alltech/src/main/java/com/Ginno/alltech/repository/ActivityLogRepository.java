package com.Ginno.alltech.repository;

import com.Ginno.alltech.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository
        extends JpaRepository<ActivityLog, Long> {

    Page<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}