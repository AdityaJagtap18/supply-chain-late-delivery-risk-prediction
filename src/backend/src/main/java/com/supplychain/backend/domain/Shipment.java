package com.supplychain.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Maps to DB-ARCH-001 S2.6 `shipment`. Only `shipping_mode` is read by any Phase 3 endpoint
 * (BE-ARCH-001 S2.3/2.4) -- the post-hoc-only fields (`actual_days`, `delivery_status`,
 * `actual_late_delivery`) are deliberately not mapped here: no endpoint in this phase's scope
 * exposes them, and DB-ARCH-001 S2.6 already flags them as evaluation-only, never an inference
 * input.
 */
@Entity
@Table(name = "shipment")
public class Shipment {

    @Id
    @Column(name = "order_id")
    private Long orderId;

    @OneToOne
    @MapsId
    @jakarta.persistence.JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "shipping_mode")
    private String shippingMode;

    protected Shipment() {
    }

    public Shipment(Order order, String shippingMode) {
        this.order = order;
        this.shippingMode = shippingMode;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getShippingMode() {
        return shippingMode;
    }
}
