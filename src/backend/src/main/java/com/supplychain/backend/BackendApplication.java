package com.supplychain.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Phase 1 skeleton entry point. Scope is deliberately limited to
 * IMPLEMENTATION-PLAN-001.md's target-flow steps 2 (PostgreSQL connectivity) and 7 (health
 * check) — see {@code com.supplychain.backend.ping} for the connectivity proof and Spring Boot
 * Actuator's {@code /actuator/health} for the health check.
 *
 * <p>{@code @EnableCaching} (UI-003 Phase 7) activates the Spring Boot cache abstraction layer
 * configured in {@code CacheConfig} -- see {@code OrderService#listOrders}.
 */
@SpringBootApplication
@EnableCaching
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
