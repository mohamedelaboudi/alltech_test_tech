package com.Ginno.alltech.controller;

import com.Ginno.alltech.dto.auth.LoginRequest;
import com.Ginno.alltech.dto.auth.LoginResponse;
import com.Ginno.alltech.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;


    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {

        return ResponseEntity.ok(
                authenticationService.login(
                        request,
                        response
                )
        );
    }


    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        return ResponseEntity.ok(
                authenticationService.refresh(
                        request,
                        response
                )
        );
    }


    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        authenticationService.logout(
                request,
                response
        );

        return ResponseEntity.noContent()
                .build();
    }
}