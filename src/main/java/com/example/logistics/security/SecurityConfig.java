package com.example.logistics.security;

import com.example.logistics.service.impl.AuthServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Central Spring Security configuration.
 *
 * Key decisions:
 *  - CSRF is disabled because this is a stateless REST API (no browser form submissions).
 *  - Sessions are STATELESS — the server never stores session state; identity is
 *    proved on every request via the JWT token in the Authorization header.
 *  - The custom JwtAuthenticationFilter runs before Spring Security's own
 *    UsernamePasswordAuthenticationFilter so the SecurityContext is populated from
 *    the token before any access-control checks happen.
 *  - Endpoint rules follow the principle of least privilege: each role can only
 *    reach the resources it legitimately needs.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — not needed for token-based REST APIs
                .csrf(csrf -> csrf.disable())

                // No server-side session; every request must carry a valid JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // Login and register are publicly accessible — no token required
                        .requestMatchers("/api/auth/**").permitAll()

                        // User management (list, create, delete, change roles) — admin only
                        .requestMatchers("/api/user/**").hasRole("ADMIN")

                        // Company, office, and employee management — staff only
                        .requestMatchers("/api/company/**").hasAnyRole("ADMIN", "EMPLOYEE")
                        .requestMatchers("/api/office/**").hasAnyRole("ADMIN", "EMPLOYEE")
                        .requestMatchers("/api/employee/**").hasAnyRole("ADMIN", "EMPLOYEE")

                        // Clients and shipments — accessible by all authenticated roles
                        .requestMatchers("/api/client/**").hasAnyRole("ADMIN", "EMPLOYEE", "CLIENT")
                        .requestMatchers("/api/shipment/**").hasAnyRole("ADMIN", "EMPLOYEE", "CLIENT")

                        // GPS tracking — employees post their location, admin/employees read it
                        .requestMatchers("/api/gps/**").hasAnyRole("ADMIN", "EMPLOYEE")

                        // All other requests require at least a valid token
                        .anyRequest().authenticated()
                )

                // Plug in the JWT filter so tokens are validated before access rules run
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Custom PasswordEncoder that matches the existing SHA-256 hashing scheme.
     * Using SHA-256 here means no database migration is needed — all stored hashes
     * remain valid. In a production system, BCrypt or Argon2 with salting is recommended.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence raw) {
                return AuthServiceImpl.hashPassword(raw.toString());
            }

            @Override
            public boolean matches(CharSequence raw, String encoded) {
                return encode(raw).equals(encoded);
            }
        };
    }

    /**
     * Wires together the UserDetailsService and PasswordEncoder so Spring Security's
     * authentication infrastructure can verify credentials consistently.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }
}
