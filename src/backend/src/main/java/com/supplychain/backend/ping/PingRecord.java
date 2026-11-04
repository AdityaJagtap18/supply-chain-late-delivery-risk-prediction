package com.supplychain.backend.ping;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

/**
 * Minimal entity used only to prove a real read/write round-trip to PostgreSQL
 * (IMPLEMENTATION-PLAN-001.md target-flow step 2). Not part of any approved schema
 * (DB-ARCH-001 / DB-ARCH-REVISION-001) and not a domain entity — this table exists solely for
 * the Phase 1 communication-proof milestone, kept alongside the real schema (now applied, per
 * Phase 2/3) as a standalone connectivity diagnostic; its table is created by
 * scripts/db/000_ping_table.sql, not Hibernate auto-DDL.
 */
@Entity
public class PingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant createdAt;

    protected PingRecord() {
        // required by JPA
    }

    public PingRecord(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
