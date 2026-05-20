package com.example.logistics.service.impl;

import com.example.logistics.model.Client;
import com.example.logistics.model.Employee;
import com.example.logistics.model.Role;
import com.example.logistics.model.User;
import com.example.logistics.repo.ClientRepository;
import com.example.logistics.repo.EmployeeRepository;
import com.example.logistics.repo.UserRepository;
import com.example.logistics.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of UserService.
 * Provides full CRUD operations for User accounts and role management.
 * Used exclusively by admin-level operations (the /api/user endpoints are
 * restricted to ADMIN role in SecurityConfig).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    /** Returns all users in the system, regardless of role. */
    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /** Returns all users that have the specified role. */
    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    /** Returns the user with the given ID, or throws if not found. */
    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    /**
     * Creates a new user with the supplied details and role.
     * The password is hashed with SHA-256 before storage — it is never persisted in plain text.
     * Email is optional; a null / blank value is stored as NULL in the database.
     */
    @Override
    public User createUser(String username, String password, String email,
                           String firstName, String lastName, Role role) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username is required");
        if (password == null || password.isBlank()) throw new IllegalArgumentException("Password is required");
        if (role == null)                           throw new IllegalArgumentException("Role is required");
        if (userRepository.existsByUsername(username))
            throw new IllegalArgumentException("Username already exists");

        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail))
            throw new IllegalArgumentException("Email already exists");

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(AuthServiceImpl.hashPassword(password));  // hash before storing
        user.setEmail(normalizedEmail);
        user.setFirstName(firstName == null || firstName.isBlank() ? defaultFirstName(username) : firstName);
        user.setLastName(lastName  == null || lastName.isBlank()   ? "User"                     : lastName);
        user.setRole(role);
        return userRepository.save(user);
    }

    /**
     * Updates the personal details (name, email) of an existing user.
     * Username, password and role cannot be changed through this method.
     */
    @Override
    public User updateUserDetails(Long userId, String firstName, String lastName, String email) {
        User user = getUserById(userId);
        if (firstName != null && !firstName.isBlank()) user.setFirstName(firstName.trim());
        if (lastName  != null && !lastName.isBlank())  user.setLastName(lastName.trim());
        // Setting email to null is allowed (removes it); a blank string is treated as removal
        user.setEmail(email == null || email.isBlank() ? null : email.trim());
        return userRepository.save(user);
    }

    /**
     * Changes the role of a user (e.g. CLIENT → EMPLOYEE).
     * Does not create or remove linked Employee / Client entities — that is handled
     * separately through the employee and client management endpoints.
     */
    @Override
    public User changeUserRole(Long userId, Role role) {
        if (role == null) throw new IllegalArgumentException("Role is required");
        User user = getUserById(userId);
        user.setRole(role);
        return userRepository.save(user);
    }

    /**
     * Deletes a user and their linked Client or Employee record.
     * Cascade deletion is also configured at the JPA level, but this explicit
     * removal makes the intent clear and avoids orphaned records.
     */
    @Override
    public void deleteUser(Long userId) {
        User user = getUserById(userId);

        // Remove the linked Client record if this user was registered as a client
        Client client = clientRepository.findByUserId(userId);
        if (client != null) clientRepository.delete(client);

        // Remove the linked Employee record if this user was an employee
        Employee employee = employeeRepository.findByUserId(userId);
        if (employee != null) employeeRepository.delete(employee);

        userRepository.delete(user);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return email.trim();
    }

    private String defaultFirstName(String username) {
        if (username == null || username.isBlank()) return "User";
        return username.substring(0, 1).toUpperCase() + username.substring(1);
    }
}
