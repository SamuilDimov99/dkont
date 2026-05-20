package com.example.logistics.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that runs once per request and authenticates users via JWT.
 *
 * Flow:
 *  1. Read the "Authorization" header.
 *  2. If it starts with "Bearer ", extract the token string.
 *  3. Validate the token (signature + expiry).
 *  4. Load the UserDetails from the database using the username inside the token.
 *  5. Place an authenticated token in the SecurityContext so Spring Security
 *     treats this request as coming from an authenticated user with the correct role.
 *
 * If the header is missing or the token is invalid, the filter does nothing —
 * Spring Security's access rules will then reject the request with 401/403
 * unless the endpoint is marked permitAll().
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // No Authorization header or wrong format — skip JWT processing entirely
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Strip the "Bearer " prefix to get the raw token string
        String token = authHeader.substring(7);

        if (jwtUtil.isTokenValid(token)) {
            // Extract the username embedded in the token claims
            String username = jwtUtil.extractUsername(token);

            // Load the full UserDetails (including granted authorities / roles)
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Build a Spring Security authentication object and populate the SecurityContext.
            // Passing null as credentials is intentional — the token itself is the proof of identity.
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

            // Attach request metadata (IP, session ID) for auditing purposes
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // Continue the filter chain regardless — Spring Security will enforce access rules next
        filterChain.doFilter(request, response);
    }
}
