package com.Ginno.alltech.service;

import com.Ginno.alltech.dto.auth.LoginRequest;
import com.Ginno.alltech.dto.auth.LoginResponse;
import com.Ginno.alltech.entity.Permission;
import com.Ginno.alltech.entity.RefreshToken;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.enums.PermissionType;
import com.Ginno.alltech.enums.UserType;
import com.Ginno.alltech.exception.ResourceNotFoundException;
import com.Ginno.alltech.repository.UserRepository;
import com.Ginno.alltech.security.AuthCookieService;
import com.Ginno.alltech.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;

    private final UserRepository userRepository;

    private final JwtService jwtService;

    private final RefreshTokenService refreshTokenService;

    private final AuthCookieService authCookieService;
    private final UserDetailsService userDetailsService;

    @Transactional
    public LoginResponse login(
            LoginRequest request,
            HttpServletResponse response
    ) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getEmail(),
                                request.getPassword()
                        )
                );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        User user =
                userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found with email: "
                                                + request.getEmail()
                                )
                        );

        // Generate access JWT
        String accessToken =
                jwtService.generateToken(userDetails);

        // Generate refresh token
        String refreshToken =
                refreshTokenService.createRefreshToken(user);

        // Store both tokens in HttpOnly cookies
        authCookieService.addAccessTokenCookie(
                response,
                accessToken
        );

        authCookieService.addRefreshTokenCookie(
                response,
                refreshToken
        );

        return buildLoginResponse(user);
    }

    @Transactional
    public LoginResponse refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        String refreshToken =
                extractCookie(
                        request,
                        "refresh_token"
                );

        RefreshToken storedToken =
                refreshTokenService.validateRefreshToken(
                        refreshToken
                );

        User user =
                storedToken.getUser();

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(
                        user.getEmail()
                );

        // Generate new access JWT
        String newAccessToken =
                jwtService.generateToken(userDetails);

        // Rotate refresh token
        String newRefreshToken =
                refreshTokenService.rotateRefreshToken(
                        storedToken,
                        user
                );

        // Set new cookies
        authCookieService.addAccessTokenCookie(
                response,
                newAccessToken
        );

        authCookieService.addRefreshTokenCookie(
                response,
                newRefreshToken
        );

        return buildLoginResponse(user);
    }

    @Transactional
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        try {
            String refreshToken =
                    extractCookie(
                            request,
                            "refresh_token"
                    );

            refreshTokenService.revoke(
                    refreshToken
            );
        } catch (IllegalArgumentException ignored) {
            // Cookie missing or empty; still proceed to clear cookies
        }

        authCookieService.deleteAccessTokenCookie(
                response
        );

        authCookieService.deleteRefreshTokenCookie(
                response
        );
    }

    private String extractCookie(
            HttpServletRequest request,
            String cookieName
    ) {

        if (request.getCookies() == null) {
            throw new IllegalArgumentException(
                    "Authentication cookie is missing"
            );
        }

        for (Cookie cookie : request.getCookies()) {

            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        throw new IllegalArgumentException(
                cookieName + " cookie is missing"
        );
    }

    private LoginResponse buildLoginResponse(
            User user
    ) {

        List<PermissionType> permissions;

        if (user.getUserType() ==
                UserType.SUPER_ADMIN) {

            permissions =
                    Arrays.asList(
                            PermissionType.values()
                    );

        } else {

            permissions =
                    user.getPermissions() != null
                            ? user.getPermissions()
                            .stream()
                            .map(Permission::getName)
                            .toList()
                            : Collections.emptyList();
        }

        return LoginResponse.builder()
                .email(user.getEmail())
                .userType(user.getUserType().name())
                .permissions(permissions)
                .expiresIn(jwtService.getExpiration())
                .build();
    }
}