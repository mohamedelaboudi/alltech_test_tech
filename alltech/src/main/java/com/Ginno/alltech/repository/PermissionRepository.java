package com.Ginno.alltech.repository;

import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.enums.PermissionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByName(PermissionType name);

    boolean existsByName(PermissionType name);
}

