package com.supplychain.backend.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Maps to DB-ARCH-001 S2.8 `app_user`. `credential_reference` is deliberately abstract per that
 * section's own note; this Phase 3 implementation makes the concrete choice to store a BCrypt
 * password hash there, consistent with ADR-0005 (session-based auth via Spring Security) -- no
 * SSO/identity-provider integration is implied.
 */
@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "credential_reference", nullable = false)
    private String credentialReference;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    protected AppUser() {
    }

    public AppUser(String username, String credentialReference, Instant createdAt) {
        this.username = username;
        this.credentialReference = credentialReference;
        this.createdAt = createdAt;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getCredentialReference() {
        return credentialReference;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
