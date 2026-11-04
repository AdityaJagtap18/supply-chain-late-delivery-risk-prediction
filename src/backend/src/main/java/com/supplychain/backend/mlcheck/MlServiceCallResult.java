package com.supplychain.backend.mlcheck;

/**
 * What actually happened when calling the ML inference service — distinguishes "couldn't even
 * reach it" from "reached it, got a non-2xx" (e.g. its honest model_unavailable 503) from a real
 * success, so the controller never collapses those into a fabricated result.
 */
public record MlServiceCallResult(
        boolean reachable, Integer httpStatus, String rawBody, MlScoreDtos.ScoreResponse body, String error) {

    public static MlServiceCallResult success(int status, MlScoreDtos.ScoreResponse body) {
        return new MlServiceCallResult(true, status, null, body, null);
    }

    public static MlServiceCallResult nonSuccess(int status, String rawBody) {
        return new MlServiceCallResult(true, status, rawBody, null, null);
    }

    public static MlServiceCallResult unreachable(String error) {
        return new MlServiceCallResult(false, null, null, null, error);
    }
}
