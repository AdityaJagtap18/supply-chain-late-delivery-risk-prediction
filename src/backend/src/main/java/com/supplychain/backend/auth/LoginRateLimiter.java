package com.supplychain.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.stereotype.Component;

/**
 * {@code SEC-THREATMODEL-001} REQ-RATE-001: {@code POST /auth/sessions} is rate-limited per
 * username, 10 attempts per 15 minutes (illustrative placeholder, per that document's own S6
 * note -- no team policy/CI history exists yet to tune this further). A simple in-memory
 * sliding-window counter, sized to this project's actual known scale (tens of internal users,
 * per `NFR-WEB-004`/`PD-VISION-001`) -- not a distributed rate-limiter, which would be
 * over-engineering for a single-instance MVP deployment (see `DEV-STRATEGY-001` S1's topology).
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, Deque<Instant>> attemptsByUsername = new ConcurrentHashMap<>();

    /** Returns true if this attempt is allowed (and is recorded); false if the limit is hit. */
    public boolean tryAcquire(String username) {
        Deque<Instant> attempts = attemptsByUsername.computeIfAbsent(
                username, key -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();
        Instant windowStart = now.minus(WINDOW);
        attempts.removeIf(attempt -> attempt.isBefore(windowStart));

        if (attempts.size() >= MAX_ATTEMPTS) {
            return false;
        }
        attempts.add(now);
        return true;
    }
}
