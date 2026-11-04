package com.supplychain.backend.ping;

import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proves backend-to-PostgreSQL connectivity with a real write followed by a real read
 * (IMPLEMENTATION-PLAN-001.md target-flow step 2). Not a domain endpoint — FR-032/FR-033's
 * actual risk list/detail contracts are a later Phase 3 task, not this skeleton's scope. Not
 * yet behind authentication (ADR-0005's session-based auth is also a later task).
 */
@RestController
@RequestMapping("/api/ping")
public class PingController {

    private final PingRepository pingRepository;

    public PingController(PingRepository pingRepository) {
        this.pingRepository = pingRepository;
    }

    @PostMapping
    public PingRecord create() {
        return pingRepository.save(new PingRecord(Instant.now()));
    }

    @GetMapping
    public List<PingRecord> list() {
        return pingRepository.findAll();
    }
}
