package com.Ginno.alltech.config;

import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import com.Ginno.alltech.repository.PermissionRepository;
import com.Ginno.alltech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initializeData() {
        return args -> {

            initializePermissions();
            initializeSuperAdmins();
        };
    }

    private void initializePermissions() {

        for (PermissionType permissionType : PermissionType.values()) {

            if (!permissionRepository.existsByName(permissionType)) {

                Permission permission = Permission.builder()
                        .name(permissionType)
                        .build();

                permissionRepository.save(permission);
            }
        }
    }

    private void initializeSuperAdmins() {

        createSuperAdminIfNotExists(
                "admin1@alltech.com",
                "Admin",
                "One",
                "Admin@123"
        );

        createSuperAdminIfNotExists(
                "admin2@alltech.com",
                "Admin",
                "Two",
                "Admin@123"
        );
    }

    private void createSuperAdminIfNotExists(
            String email,
            String firstName,
            String lastName,
            String password
    ) {

        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .userType(UserType.SUPER_ADMIN)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
    }
}

