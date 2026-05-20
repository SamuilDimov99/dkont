package com.example.logistics.web;

import com.example.logistics.model.EmployeeType;
import com.example.logistics.model.Role;
import com.example.logistics.security.JwtUtil;
import com.example.logistics.service.AuthService;
import com.example.logistics.service.AuthService.AuthSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication.
 * Exposes two public endpoints (no JWT required):
 *   POST /api/auth/login    — validate credentials and receive a token
 *   POST /api/auth/register — create a new CLIENT account and receive a token
 *
 * Both endpoints return a LoginResponse that contains the JWT token alongside
 * all session fields (role, IDs) that the frontend needs for role-based rendering.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthApiController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    /**
     * Authenticates an existing user.
     * The service validates the SHA-256 password hash; if credentials are wrong it
     * throws, which the global exception handler converts to a 400 response.
     * On success a signed JWT is generated and returned with the session data.
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestParam String username, @RequestParam String password) {
        AuthSession session = authService.login(username, password);
        String token = jwtUtil.generateToken(username, session.role().name());
        return toLoginResponse(token, session);
    }

    /**
     * Registers a new client account and immediately logs the user in.
     * Email is optional — pass an empty string or omit the parameter entirely.
     * The returned token has the same structure as the login token so the frontend
     * can handle both flows identically.
     */
    @PostMapping("/register")
    public LoginResponse register(@RequestParam String username,
                                  @RequestParam String password,
                                  @RequestParam(required = false) String email) {
        AuthSession session = authService.registerClient(username, password, email);
        String token = jwtUtil.generateToken(username, session.role().name());
        return toLoginResponse(token, session);
    }

    /** Merges the JWT token with the session fields into a single flat response object. */
    private LoginResponse toLoginResponse(String token, AuthSession session) {
        return new LoginResponse(
                token,
                session.userId(),
                session.username(),
                session.email(),
                session.role(),
                session.clientId(),
                session.employeeId(),
                session.employeeType(),
                session.officeId()
        );
    }

    /**
     * The response body returned by both /login and /register.
     * Contains the JWT token (used by the frontend for all subsequent requests)
     * plus the full session data (role, linked entity IDs) needed for UI rendering.
     */
    public record LoginResponse(
            String token,
            long userId,
            String username,
            String email,
            Role role,
            Long clientId,
            Long employeeId,
            EmployeeType employeeType,
            Long officeId
    ) {}
}
