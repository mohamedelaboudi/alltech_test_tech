package com.Ginno.alltech.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthCookieService {

    @Value("${auth.cookie.secure}")
    private boolean secure;

    @Value("${auth.cookie.same-site}")
    private String sameSite;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    public void addAccessTokenCookie(
            HttpServletResponse response,
            String token
    ) {

        ResponseCookie cookie =
                ResponseCookie.from(
                                "access_token",
                                token
                        )
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite(sameSite)
                        .path("/")
                        .maxAge(Duration.ofMillis(accessTokenExpiration))
                        .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    public void addRefreshTokenCookie(
            HttpServletResponse response,
            String token
    ) {
        addRefreshTokenCookie(response, token, Duration.ofMillis(refreshTokenExpiration));
    }

    public void addRefreshTokenCookie(
            HttpServletResponse response,
            String token,
            Duration maxAge
    ) {

        ResponseCookie cookie =
                ResponseCookie.from(
                                "refresh_token",
                                token
                        )
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite(sameSite)
                        .path("/api/auth")
                        .maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge)
                        .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    public void deleteAccessTokenCookie(
            HttpServletResponse response
    ) {

        ResponseCookie cookie =
                ResponseCookie.from(
                                "access_token",
                                ""
                        )
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite(sameSite)
                        .path("/")
                        .maxAge(0)
                        .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    public void deleteRefreshTokenCookie(
            HttpServletResponse response
    ) {

        ResponseCookie cookie =
                ResponseCookie.from(
                                "refresh_token",
                                ""
                        )
                        .httpOnly(true)
                        .secure(secure)
                        .sameSite(sameSite)
                        .path("/api/auth")
                        .maxAge(0)
                        .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }
}
