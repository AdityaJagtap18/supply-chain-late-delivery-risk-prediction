package com.supplychain.backend.ping;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PingRepository extends JpaRepository<PingRecord, Long> {
}
