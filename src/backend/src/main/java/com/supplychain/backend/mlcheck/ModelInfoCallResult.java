package com.supplychain.backend.mlcheck;

import java.util.Map;

/**
 * UI-003 Phase 6: the result of calling the ML service's {@code GET /model-info}, mirroring
 * {@link MlServiceCallResult}'s reachable/non-2xx/unreachable distinction so the controller never
 * collapses those into a fabricated response.
 */
public record ModelInfoCallResult(
        boolean reachable, Integer httpStatus, String rawBody, Map<String, Object> body, String error) {

    public static ModelInfoCallResult success(int status, Map<String, Object> body) {
        return new ModelInfoCallResult(true, status, null, body, null);
    }

    public static ModelInfoCallResult nonSuccess(int status, String rawBody) {
        return new ModelInfoCallResult(true, status, rawBody, null, null);
    }

    public static ModelInfoCallResult unreachable(String error) {
        return new ModelInfoCallResult(false, null, null, null, error);
    }
}
