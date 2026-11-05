// Production build config (angular.json's "production" configuration file-replaces
// environment.ts with this file). apiBaseUrl points at the backend's own public subdomain
// (see docs/DEPLOYMENT.md) rather than a relative path, since the Angular SPA's client-side
// routes (e.g. /orders/:orderId) and the backend's REST routes (e.g. /orders/:orderId) share
// the same path shape and would collide if served from one origin behind a single reverse proxy.
export const environment = {
  apiBaseUrl: 'https://shipguard-api.adityajagtap.com',
};
