package com.example.logistics.security;

import com.example.logistics.model.User;
import com.example.logistics.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Bridges the application's User entity with Spring Security's authentication framework.
 *
 * Spring Security calls loadUserByUsername() internally whenever it needs to verify
 * credentials or resolve the authorities of an already-authenticated user.
 * The role is mapped to a Spring GrantedAuthority using the "ROLE_" prefix convention
 * (e.g. Role.ADMIN → "ROLE_ADMIN"), which is what hasRole("ADMIN") checks against.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a user by username and converts it to a Spring Security UserDetails object.
     *
     * @param username the username to look up
     * @return UserDetails containing the hashed password and a single granted authority
     * @throws UsernameNotFoundException if no user with that username exists
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user == null) throw new UsernameNotFoundException("User not found: " + username);

        // Map the application Role enum to a Spring Security GrantedAuthority.
        // The "ROLE_" prefix is required by Spring Security's hasRole() matcher.
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
