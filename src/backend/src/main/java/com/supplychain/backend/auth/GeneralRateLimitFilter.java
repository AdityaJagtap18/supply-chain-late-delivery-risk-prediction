package com.supplychain.backend.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * {@code SEC-THREATMODEL-001} REQ-RATE-002: "general API endpoints need only basic abuse
 * protection (a generous per-session limit) sized to 'catch a misbehaving client or bug,' not
 * 'withstand a distributed attack.'" Keyed by remote address (this MVP has no API-key/client-id
 * concept) -- 120 requests/minute, a deliberately generous placeholder consistent with that
 * document's explicit "tens of users, not thousands" scale assumption (S6), not a security
 * boundary against a determined attacker. `/actuator/health` is excluded so container/orchestrator
 * health probes are never throttled.
 */
@Component
public class GeneralRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 120;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Deque<Instant>> requestsByClient = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        if ("/actuator/health".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = request.getRemoteAddr();
        Deque<Instant> timestamps = requestsByClient.computeIfAbsent(
                clientKey, key -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();
        Instant windowStart = now.minus(WINDOW);
        timestamps.removeIf(timestamp -> timestamp.isBefore(windowStart));

        if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
            response.setStatus(429);
            response.getWriter().write("Too many requests -- try again shortly.");
            return;
        }
        timestamps.add(now);
        filterChain.doFilter(request, response);
    }
}
