package com.example.logistics.service.impl;

import com.example.logistics.model.*;
import com.example.logistics.repo.*;
import com.example.logistics.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Implementation of AuthService.
 * Handles user login and client self-registration.
 * Passwords are stored and compared as SHA-256 hex digests.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Validates credentials and returns a session record for the authenticated user.
     * Looks up the user by username, hashes the submitted password, and compares it
     * to the stored hash. Throws if either the user is not found or the password does
     * not match — the same generic message is used deliberately to avoid leaking
     * whether the username exists.
     */
    @Override
    @Transactional(readOnly = true)
    public AuthSession login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user == null || !user.getPasswordHash().equals(hashPassword(password))) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        // Resolve optional linked entities so the session carries all the IDs the
        // frontend needs for role-based rendering and data filtering.
        Client client = clientRepository.findByUserId(user.getId());
        Employee employee = employeeRepository.findByUserId(user.getId());

        Long clientId      = client   == null ? null : client.getId();
        Long employeeId    = employee == null ? null : employee.getId();
        EmployeeType type  = employee == null ? null : employee.getEmployeeType();
        Long officeId      = (employee == null || employee.getOffice() == null)
                             ? null : employee.getOffice().getId();

        return new AuthSession(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getRole(), clientId, employeeId, type, officeId);
    }

    /**
     * Registers a new client account.
     * Always assigns the CLIENT role — only admins can create EMPLOYEE / ADMIN accounts.
     * A Client record is created alongside the User so the new account can immediately
     * send and receive shipments.
     */
    @Override
    public AuthSession registerClient(String username, String password, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }

        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Build and persist the User entity
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(hashPassword(password));
        user.setEmail(normalizedEmail);
        user.setFirstName(defaultFirstName(username));
        user.setLastName("User");
        user.setRole(Role.CLIENT);
        userRepository.save(user);

        // Every registered user who is a CLIENT needs a corresponding Client record
        // that acts as the sender / recipient on shipments.
        Client client = new Client();
        client.setUser(user);
        clientRepository.save(client);

        return new AuthSession(
                user.getId(), user.getUsername(), user.getEmail(),
                Role.CLIENT, client.getId(), null, null, null);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Capitalises the first letter of the username to use as a default first name. */
    private String defaultFirstName(String username) {
        if (username == null || username.isBlank()) return "User";
        return username.substring(0, 1).toUpperCase() + username.substring(1);
    }

    /** Returns null for blank / missing email so the unique constraint is not triggered. */
    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim();
    }

    /**
     * One-way SHA-256 hash of a plain-text password.
     * The result is a 64-character lowercase hex string stored in the database.
     * Note: no salt is used — acceptable for this educational project.
     */
    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
