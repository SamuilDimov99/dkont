package com.example.logistics.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility class for JWT (JSON Web Token) operations.
 *
 * Tokens are signed with HMAC-SHA256 using a secret key loaded from application.properties.
 * Each token encodes the username (subject) and the user's role as a custom claim,
 * along with issued-at and expiration timestamps.
 *
 * The frontend stores the token in localStorage and sends it in the
 * Authorization header as "Bearer <token>" on every API request.
 */
@Component
public class JwtUtil {

    /** Secret key string from application.properties — must be at least 32 characters. */
    @Value("${jwt.secret}")
    private String secret;

    /** Token lifetime in milliseconds. Default is 86400000 ms = 24 hours. */
    @Value("${jwt.expiration:86400000}")
    private long expiration;

    /**
     * Derives the HMAC-SHA256 signing key from the configured secret string.
     * Converting the string to raw UTF-8 bytes avoids Base64 encoding requirements.
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed JWT token for the given user.
     *
     * @param username the user's login name, stored as the token subject
     * @param role     the user's role (e.g. "ADMIN", "EMPLOYEE", "CLIENT"),
     *                 stored as a custom "role" claim so the filter can read it
     * @return a compact, URL-safe JWT string
     */
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the username (subject) from a token.
     * Call only after isTokenValid() returns true.
     */
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Returns true if the token has a valid signature and has not expired.
     * Any parse or validation error is caught and treated as invalid.
     */
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Parses and verifies the token signature, returning the claims payload.
     * Throws a JwtException if the token is malformed, expired, or tampered with.
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
