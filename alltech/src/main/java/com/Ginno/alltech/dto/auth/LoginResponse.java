package com.Ginno.alltech.dto.auth;

import com.Ginno.alltech.enums.PermissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String email;

    private String userType;

    private List<PermissionType> permissions;

    private long expiresIn;
}