package com.Ginno.alltech.service;

import com.Ginno.alltech.entity.RefreshToken;
import com.Ginno.alltech.entity.User;
import com.Ginno.alltech.exception.ResourceNotFoundException;
import com.Ginno.alltech.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Creates a new refresh token.
     *
     * The raw token is returned to the caller,
     * but only its SHA-256 hash is stored in the database.
     */
    @Transactional
    public String createRefreshToken(User user) {

        LocalDateTime expiresAt = LocalDateTime.now()
                .plusNanos(refreshExpiration * 1_000_000);
        return createRefreshToken(user, expiresAt);
    }

    private String createRefreshToken(User user, LocalDateTime expiresAt) {

        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hashToken(rawToken))
                .user(user)
                .expiresAt(expiresAt)
                .revoked(false)
                .createdAt(LocalDateTime.now())
                .build();

        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }


    /**
     * Validates the refresh token and returns its entity.
     */
    @Transactional
    public RefreshToken validateRefreshToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is missing"
            );
        }

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByTokenHashAndRevokedFalse(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid refresh token"
                                )
                        );

        if (refreshToken.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);

            throw new IllegalArgumentException(
                    "Refresh token has expired"
            );
        }

        if (!refreshToken.getUser().isEnabled()) {
            throw new IllegalArgumentException(
                    "User account is disabled"
            );
        }

        return refreshToken;
    }

    /**
     * Revokes a refresh token.
     */
    @Transactional
    public void revoke(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        String tokenHash = hashToken(rawToken);

        refreshTokenRepository
                .findByTokenHashAndRevokedFalse(tokenHash)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    /**
     * Hashes the raw refresh token using SHA-256.
     */
    private String hashToken(String token) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(hash);

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 algorithm not available",
                    e
            );
        }
    }
    @Transactional
    public String rotateRefreshToken(
            RefreshToken oldToken,
            User user
    ) {

        oldToken.setRevoked(true);

        refreshTokenRepository.save(oldToken);

        // Rotation must retain the original absolute expiry. Otherwise every
        // access-token refresh would extend the session by another seven days.
        return createRefreshToken(user, oldToken.getExpiresAt());
    }
}
