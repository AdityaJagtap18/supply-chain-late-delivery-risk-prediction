package com.supplychain.backend.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    Optional<RiskAssessment> findFirstByOrder_OrderIdOrderByScoredAtDesc(Long orderId);

    List<RiskAssessment> findByOrder_OrderIdOrderByScoredAtDesc(Long orderId);

    @org.springframework.data.jpa.repository.Query(
            "select ra from RiskAssessment ra where ra.scoredAt = ("
                    + "select max(ra2.scoredAt) from RiskAssessment ra2 where ra2.order.orderId = ra.order.orderId"
                    + ")")
    List<RiskAssessment> findLatestPerOrder();
}
