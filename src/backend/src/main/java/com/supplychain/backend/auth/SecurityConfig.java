package com.supplychain.backend.auth;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * ADR-0005 (Accepted): session-based authentication via Spring Security, for FR-034/NFR-WEB-001.
 * Enforces authentication on every endpoint except the two already-open Phase 1 diagnostic
 * endpoints (`/api/ping`, `/api/ml-check`) and `/actuator/health` -- none of those expose order
 * or risk data, so FR-034's requirement ("any risk list, detail view, or underlying order data")
 * does not reach them.
 *
 * <p><strong>Known simplification, not a `SEC-THREATMODEL-001` decision:</strong> CSRF
 * protection is disabled below. That Approved document's REQ list does not name a CSRF
 * requirement for this session cookie; disabling it here is the minimal choice to make the JSON
 * API usable from the Angular frontend without inventing a token scheme that document hasn't
 * asked for. Must be revisited before any real deployment.
 *
 * <p>Phase 5 additions, per `SEC-THREATMODEL-001`: REQ-RATE-002 via
 * {@link GeneralRateLimitFilter} (wired below); REQ-AUTH-002's idle-session timeout is set in
 * {@code application.yml} (`server.servlet.session.timeout`), not here.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Comma-separated list of origins allowed to call this API with credentials. Defaults to
    // the local dev frontend; production sets ALLOWED_ORIGINS to the deployed frontend's
    // subdomain (see docs/DEPLOYMENT.md) rather than hardcoding it here.
    @Value("${ALLOWED_ORIGINS:http://localhost:4200}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "DELETE"));
        configuration.setAllowedHeaders(List.of("Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint restAuthenticationEntryPoint() {
        return (request, response, authException) ->
                response.sendError(401, "Unauthenticated");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                     GeneralRateLimitFilter generalRateLimitFilter) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .exceptionHandling(handling ->
                        handling.authenticationEntryPoint(restAuthenticationEntryPoint()))
                // SEC-THREATMODEL-001 REQ-RATE-002 -- a generous, session/IP-scoped abuse check
                // ahead of authentication, so it also covers the one unauthenticated endpoint.
                .addFilterBefore(generalRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/api/ping", "/api/ml-check").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/auth/sessions").permitAll()
                        .anyRequest().authenticated());
        return http.build();
    }
}
