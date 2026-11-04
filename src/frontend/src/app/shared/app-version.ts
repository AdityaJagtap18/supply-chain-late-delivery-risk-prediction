/**
 * Single canonical source of the application's user-facing version. Every place that displays a
 * version (sidebar footer, Understand Repository, Patch Notes) imports this constant instead of
 * hardcoding its own copy. There is no backend endpoint for this -- it is purely static display
 * metadata with no server-side state, so a frontend constant is the simplest fit; see
 * docs/decisions or the Patch Notes page for why v1.0.0 is the documented baseline (no prior Git
 * tags or release metadata exist in this repository's history).
 *
 * To cut a new release: bump APP_VERSION (SemVer), update RELEASE_DATE, and add a matching entry
 * to release-notes.data.ts with the same version string.
 */
export const APP_VERSION = '1.0.0';
export const RELEASE_DATE = '2026-11-04';
export const REPOSITORY_URL = 'https://github.com/AdityaJagtap18/supply-chain-late-delivery-risk-prediction';
export const AUTHOR_NAME = 'AdityaJagtap';
export const AUTHOR_URL = 'https://adityajagtap.com/';
