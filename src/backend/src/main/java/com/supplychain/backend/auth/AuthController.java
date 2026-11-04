package com.supplychain.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * BE-ARCH-001 S2.1/S2.2 -- {@code POST}/{@code DELETE /auth/sessions} (FR-034). `credential`'s
 * meaning is the BCrypt-hashed password this Phase 3 implementation chose for
 * `app_user.credential_reference` (see AppUser's class comment).
 *
 * <p>Implements {@code SEC-THREATMODEL-001} REQ-INPUT-003 (request-body validation) and
 * REQ-RATE-001 (login rate limiting, via {@link LoginRateLimiter}).
 */
@RestController
public class AuthController {

    public record LoginRequest(
            @NotBlank @Size(max = 255) String username,
            @NotBlank @Size(max = 255) String credential) {
    }

    public record LoginResponse(Long userId, String username, String sessionToken) {
    }

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(AuthenticationManager authenticationManager,
                           AppUserRepository appUserRepository,
                           LoginRateLimiter loginRateLimiter) {
        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/auth/sessions")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                                HttpServletRequest httpRequest,
                                                HttpServletResponse httpResponse) {
        // REQ-RATE-001 (placeholder: 10 attempts/15 min per username, illustrative per
        // SEC-THREATMODEL-001 S6) -- a generic credential-stuffing mitigation on the one
        // unauthenticated endpoint in this API.
        if (!loginRateLimiter.tryAcquire(request.username())) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "Too many login attempts -- try again later.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.credential()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, httpRequest, httpResponse);

        AppUser appUser = appUserRepository.findByUsername(request.username()).orElseThrow();
        appUser.setLastLoginAt(Instant.now());
        appUserRepository.save(appUser);

        String sessionToken = httpRequest.getSession(false) != null
                ? httpRequest.getSession(false).getId()
                : "";
        return ResponseEntity.ok(new LoginResponse(appUser.getUserId(), appUser.getUsername(), sessionToken));
    }

    @DeleteMapping("/auth/sessions")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        if (httpRequest.getSession(false) != null) {
            httpRequest.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
