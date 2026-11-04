#!/usr/bin/env bash
# Applies scripts/db/*.sql, in order, to the running `postgres` compose service.
# Developer convenience only -- never imported by src/frontend, src/backend, or src/ml-service
# at runtime (see scripts/README.md).
#
# Usage: ./scripts/run_migration.sh
# Requires: `docker compose up -d postgres` already running from infra/docker/, and this
# script's .env (POSTGRES_DB/POSTGRES_USER) matching what that container was started with.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../infra/docker"
DB_DIR="$SCRIPT_DIR/db"

POSTGRES_DB="${POSTGRES_DB:-supplychain_dev}"
POSTGRES_USER="${POSTGRES_USER:-supplychain_dev}"

for sql_file in "$DB_DIR"/*.sql; do
    echo "Applying $(basename "$sql_file")..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T postgres \
        psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$sql_file"
done

echo "Migration complete."
