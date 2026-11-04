package com.supplychain.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Maps to DB-ARCH-001 S2.1 `customer`. Only `customer_segment` is read by any Phase 3 endpoint
 * (BE-ARCH-001 S2.4's `customer: { segment }`); customer_location's fields are never read here,
 * per CONS-004/BE-ARCH-001's deliberately conservative contract.
 */
@Entity
@Table(name = "customer")
public class Customer {

    @Id
    @Column(name = "customer_id")
    private Integer customerId;

    @Column(name = "customer_segment")
    private String customerSegment;

    protected Customer() {
    }

    public Customer(Integer customerId, String customerSegment) {
        this.customerId = customerId;
        this.customerSegment = customerSegment;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public String getCustomerSegment() {
        return customerSegment;
    }
}
