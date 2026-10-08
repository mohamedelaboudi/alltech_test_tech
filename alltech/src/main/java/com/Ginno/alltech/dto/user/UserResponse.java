package com.Ginno.alltech.dto.user;

import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private UserType userType;
    private boolean enabled;
    private LocalDateTime createdAt;
    private Set<PermissionType> permissions;

}