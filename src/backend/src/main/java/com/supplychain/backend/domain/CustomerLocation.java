package com.supplychain.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Maps to DB-ARCH-001 S2.2 `customer_location`. Added in Phase 4 solely so
 * {@code BatchScoringService} can assemble the `customerCity`/`customerZipcode` features
 * ML-INFERENCE-001 S1 requires -- this is an internal, batch-job-only read. It does NOT reopen
 * CONS-004/BE-ARCH-001's decision that no HTTP response exposes these fields: no controller in
 * this codebase returns a CustomerLocation, and `latitude`/`longitude` are deliberately not
 * mapped here at all (not needed for inference, and DB-ARCH-001 S2.2 flags them as
 * access-restricted).
 */
@Entity
@Table(name = "customer_location")
public class CustomerLocation {

    @Id
    @Column(name = "customer_id")
    private Integer customerId;

    @Column(name = "customer_city")
    private String customerCity;

    @Column(name = "customer_state")
    private String customerState;

    @Column(name = "customer_zipcode")
    private String customerZipcode;

    @Column(name = "customer_country")
    private String customerCountry;

    protected CustomerLocation() {
    }

    public CustomerLocation(Integer customerId, String customerCity, String customerState,
                             String customerZipcode, String customerCountry) {
        this.customerId = customerId;
        this.customerCity = customerCity;
        this.customerState = customerState;
        this.customerZipcode = customerZipcode;
        this.customerCountry = customerCountry;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public String getCustomerCity() {
        return customerCity;
    }

    public String getCustomerZipcode() {
        return customerZipcode;
    }
}
