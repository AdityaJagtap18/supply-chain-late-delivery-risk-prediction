// Phase 1 skeleton: hardcoded to the host-mapped backend port from .env.example's
// API_BASE_URL, since the browser (running on the host, not inside the Docker network) reaches
// the backend container via its host-published port, not its Docker-internal service name.
// A real build-time/runtime configuration mechanism is a later task, not this skeleton's scope.
export const environment = {
  apiBaseUrl: 'http://localhost:8080',
};
