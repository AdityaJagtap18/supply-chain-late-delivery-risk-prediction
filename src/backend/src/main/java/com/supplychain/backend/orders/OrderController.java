package com.supplychain.backend.orders;

import com.supplychain.backend.orders.OrderDtos.OrderDetailResponse;
import com.supplychain.backend.orders.OrderDtos.OrdersResponse;
import com.supplychain.backend.orders.OrderDtos.RiskAssessmentHistoryResponse;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * BE-ARCH-001 S2.3/S2.4/S2.5 -- FR-032 (risk queue) and FR-033 (order detail + history).
 *
 * <p>Implements {@code SEC-THREATMODEL-001} REQ-INPUT-001 (query-param enum validation),
 * REQ-AUDIT-001/002/003 (risk-assessment access logging -- the user, the order id or filter
 * params, and the endpoint; never a quasi-identifier value in the log line itself).
 */
@RestController
public class OrderController {

    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");

    /** UI-DESIGN-001 S3.1's defined `riskBand` filter set -- an unrecognized value is rejected. */
    private static final Set<String> ALLOWED_RISK_BANDS = Set.of("high", "medium", "low", "stale");

    /** DB-ARCH-001 S2.3's actual `order_status` values -- an unrecognized value is rejected. */
    private static final Set<String> ALLOWED_STATUSES =
            Set.of("COMPLETE", "PENDING_PAYMENT", "PROCESSING", "CLOSED");

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public OrdersResponse listOrders(@RequestParam Optional<String> riskBand,
                                      @RequestParam Optional<String> status,
                                      Authentication authentication) {
        riskBand.filter(value -> !ALLOWED_RISK_BANDS.contains(value.toLowerCase()))
                .ifPresent(value -> {
                    throw new ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "Unrecognized riskBand: " + value);
                });
        status.filter(value -> !ALLOWED_STATUSES.contains(value))
                .ifPresent(value -> {
                    throw new ResponseStatusException(
                            org.springframework.http.HttpStatus.BAD_REQUEST, "Unrecognized status: " + value);
                });

        // REQ-AUDIT-002: the list-query event itself (user, filter params, result count) -- not
        // one log entry per returned order, which QA-STRATEGY-001 S5 explicitly scoped out as
        // high-volume/low-value.
        OrdersResponse response = orderService.listOrders(riskBand, status);
        auditLog.info("user={} action=listOrders riskBand={} status={} resultCount={}",
                authentication.getName(), riskBand.orElse(null), status.orElse(null),
                response.orders().size());
        return response;
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable Long orderId,
                                                                Authentication authentication) {
        // REQ-AUDIT-001: every read of a specific order's risk assessment is logged with user,
        // order id, timestamp (via the logger's own timestamp), and endpoint. REQ-AUDIT-003: no
        // quasi-identifier value appears in this line -- only the order id, never a city/zip/etc.
        auditLog.info("user={} action=getOrderDetail orderId={}", authentication.getName(), orderId);
        return orderService.getOrderDetail(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/orders/{orderId}/risk-assessments")
    public ResponseEntity<RiskAssessmentHistoryResponse> getRiskHistory(@PathVariable Long orderId,
                                                                         Authentication authentication) {
        auditLog.info("user={} action=getRiskHistory orderId={}", authentication.getName(), orderId);
        return orderService.getRiskHistory(orderId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
