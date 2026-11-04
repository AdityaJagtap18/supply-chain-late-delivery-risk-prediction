package com.supplychain.backend.scoring;

import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * UI-003 Phase 7's "Spring Boot cache abstraction" layer: Postgres stays the authoritative
 * source, this in-memory cache sits in front of {@code OrderService#listOrders}'s N+1 repository
 * reads, and {@code OrderService#evictOrdersListingCache} is the one explicit invalidation rule
 * -- called right after a batch-scoring run persists new {@code risk_assessment} rows, so a
 * cached listing is never served once the data it reflects is stale. Redis (the spec's optional
 * next layer) is not introduced here: nothing in this app's current traffic needs a
 * cross-instance cache, and adding one unasked would be exactly the kind of unapproved
 * architecture expansion UI-003 says not to make.
 */
@Configuration
public class CacheConfig {

    public static final String ORDERS_LISTING_CACHE = "ordersListing";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(List.of(ORDERS_LISTING_CACHE).toArray(new String[0]));
    }
}
