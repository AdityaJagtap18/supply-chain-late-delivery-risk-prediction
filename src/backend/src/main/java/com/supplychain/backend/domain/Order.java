package com.supplychain.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Maps to DB-ARCH-001 S2.3 `order`, including the DB-ARCH-REVISION-001 `payment_type` column.
 * `payment_type` is not read by any Phase 3 endpoint (it exists to feed the ML inference
 * boundary, per that revision S6) but is mapped here since it is `NOT NULL` on the table and
 * this entity is used for reads, not just writes elsewhere.
 */
@Entity
@Table(name = "`order`")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne
    @jakarta.persistence.JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "order_city")
    private String orderCity;

    @Column(name = "order_country")
    private String orderCountry;

    @Column(name = "order_region")
    private String orderRegion;

    @Column(name = "order_state")
    private String orderState;

    @Column(name = "market")
    private String market;

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "placed_at")
    private Instant placedAt;

    @Column(name = "payment_type", nullable = false)
    private String paymentType;

    protected Order() {
    }

    public Order(Customer customer, String orderCity, String orderCountry, String orderRegion,
                 String orderState, String market, String orderStatus, Instant placedAt,
                 String paymentType) {
        this.customer = customer;
        this.orderCity = orderCity;
        this.orderCountry = orderCountry;
        this.orderRegion = orderRegion;
        this.orderState = orderState;
        this.market = market;
        this.orderStatus = orderStatus;
        this.placedAt = placedAt;
        this.paymentType = paymentType;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public String getOrderCity() {
        return orderCity;
    }

    public String getOrderCountry() {
        return orderCountry;
    }

    public String getOrderRegion() {
        return orderRegion;
    }

    public String getOrderState() {
        return orderState;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public Instant getPlacedAt() {
        return placedAt;
    }

    public String getPaymentType() {
        return paymentType;
    }
}
