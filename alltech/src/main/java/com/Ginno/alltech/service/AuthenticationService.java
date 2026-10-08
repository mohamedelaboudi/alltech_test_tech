package com.Ginno.alltech.service;

import com.Ginno.alltech.dto.auth.LoginRequest;
import com.Ginno.alltech.dto.auth.LoginResponse;
import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import com.Ginno.alltech.exception.ResourceNotFoundException;
import com.Ginno.alltech.repository.UserRepository;
import com.Ginno.alltech.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getEmail(),
                                request.getPassword()
                        )
                );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: "
                                        + request.getEmail()
                        )
                );
        String token = jwtService.generateToken(userDetails);

        List<PermissionType> permissions;
        if (user.getUserType() == UserType.SUPER_ADMIN) {
            permissions = Arrays.asList(PermissionType.values());
        } else {
            permissions = user.getPermissions() != null
                    ? user.getPermissions().stream().map(Permission::getName).toList()
                    : Collections.emptyList();
        }

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .userType(user.getUserType().name())
                .permissions(permissions)
                .build();
    }
}
