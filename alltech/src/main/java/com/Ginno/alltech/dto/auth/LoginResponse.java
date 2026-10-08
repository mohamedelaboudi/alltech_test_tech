package com.Ginno.alltech.dto.auth;

import com.Ginno.alltech.enums.PermissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class LoginResponse {

    private String token;

    private String tokenType;

    private String email;

    private String userType;

    private List<PermissionType> permissions;
}
