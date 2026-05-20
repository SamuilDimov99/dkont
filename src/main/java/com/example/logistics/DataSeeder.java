package com.example.logistics;

import com.example.logistics.model.Role;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.UserService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Ensures an ADMIN user exists in the database when the application starts.
 *
 * This runs once after the Spring context is fully initialised (@PostConstruct).
 * If the database already contains at least one ADMIN user, seeding is skipped —
 * making this safe to run on every restart without creating duplicates.
 *
 * Credentials are read from application.properties so they can be overridden
 * per environment (dev uses admin/admin; production uses environment variables).
 */
@Component
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${admin.seed.username:admin}")
    private String adminUsername;

    @Value("${admin.seed.password:admin}")
    private String adminPassword;

    /** Default email satisfies the NOT NULL constraint while remaining clearly non-personal. */
    @Value("${admin.seed.email:admin@localhost}")
    private String adminEmail;

    /**
     * Seeds the admin user if none exists yet.
     * UserService.createUser() handles password hashing and duplicate checks.
     */
    @PostConstruct
    public void seed() {
        if (userRepository.findByRole(Role.ADMIN).isEmpty()) {
            userService.createUser(adminUsername, adminPassword, adminEmail, "Admin", "User", Role.ADMIN);
        }
    }
}
