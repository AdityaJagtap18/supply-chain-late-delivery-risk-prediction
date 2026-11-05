# Deploying to the Hostinger VPS

Live at:
- Frontend: https://shipguard.adityajagtap.com
- Backend API: https://shipguard-api.adityajagtap.com

Two subdomains, not one — the Angular SPA's client-side routes and the backend's REST routes
use the same path shapes (both have `/orders/:id`), so they can't share one origin behind a
reverse proxy; a dedicated API subdomain avoids that collision.

This VPS (`187.127.108.141`, 1 vCPU / 4GB RAM) already runs another project behind a host-level
nginx + certbot, so this deployment:
- Adds **new nginx vhosts** for the two new subdomains (same pattern as the existing project),
  instead of running its own reverse proxy container.
- Pulls **prebuilt Docker images from GHCR** rather than building on the VPS — the box doesn't
  have the CPU/RAM to build the Maven/Spring Boot image comfortably alongside what's already
  running. Images are built on GitHub Actions runners and pushed by
  [.github/workflows/deploy.yml](../.github/workflows/deploy.yml).
- Publishes `frontend`/`backend` only to `127.0.0.1` (ports `4201`/`8081`); nginx proxies to
  those. `postgres`/`ml-service` publish no host port at all.

## 1. DNS (done)

`shipguard` and `shipguard-api` A records on `adityajagtap.com` point at `187.127.108.141`.

## 2. VPS one-time setup

SSH in as `root` (an SSH key named `shipguard-deploy` is already authorized):

```bash
ssh root@187.127.108.141
```

Install Docker + Compose plugin:

```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
```

Clone the repo:

```bash
cd /root
git clone https://github.com/AdityaJagtap18/supply-chain-late-delivery-risk-prediction.git shipguard
cd shipguard
cp infra/docker/.env.prod.example infra/docker/.env.prod
nano infra/docker/.env.prod   # fill in real passwords/secrets
```

Add the nginx vhosts (same shape as the existing `cdpi-backend` one on this box):

```bash
cat > /etc/nginx/sites-available/shipguard-frontend <<'EOF'
server {
    server_name shipguard.adityajagtap.com;
    location / {
        proxy_pass http://127.0.0.1:4201;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 80;
}
EOF

cat > /etc/nginx/sites-available/shipguard-backend <<'EOF'
server {
    server_name shipguard-api.adityajagtap.com;
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 80;
}
EOF

ln -s /etc/nginx/sites-available/shipguard-frontend /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/shipguard-backend /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Get Let's Encrypt certs (certbot edits the vhosts above in place to add the `443 ssl` blocks and
the http→https redirect, same as the existing project):

```bash
certbot --nginx -d shipguard.adityajagtap.com -d shipguard-api.adityajagtap.com \
  --non-interactive --agree-tos -m adiraj2503@gmail.com --redirect
```

The images this compose file pulls are private GHCR packages by default — authenticate once with
a GitHub [personal access token](https://github.com/settings/tokens) that has `read:packages`
scope (or make the three packages public under the repo owner's GitHub → Packages settings,
after the first push, to skip this):

```bash
echo YOUR_PAT | docker login ghcr.io -u AdityaJagtap18 --password-stdin
```

## 3. First deploy (manual, before wiring CI/CD)

```bash
cd /root/shipguard
docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.prod pull
docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.prod up -d
```

Check it's up:

```bash
curl -s https://shipguard-api.adityajagtap.com/actuator/health
curl -sI https://shipguard.adityajagtap.com
```

## 4. GitHub Actions secrets (for automatic deploys)

The workflow tests all three services on every push/PR, builds and pushes images to GHCR on a
push to `main`, then SSHes into the VPS to pull and restart. Add these in **Settings → Secrets
and variables → Actions**:

| Secret            | Value                                      |
|-------------------|---------------------------------------------|
| `VPS_HOST`        | `187.127.108.141`                            |
| `VPS_USER`        | `root`                                       |
| `VPS_SSH_KEY`      | The private half of the `shipguard-deploy` key |
| `VPS_PORT`        | `22`                                         |
| `VPS_DEPLOY_PATH` | `/root/shipguard`                             |

No extra secret is needed for GHCR push — the workflow uses the auto-generated
`GITHUB_TOKEN`, which already has permission to push packages to this repo.

Push to `main` and watch the **Actions** tab.

## Notes / things to revisit

- `infra/docker/.env.prod` lives only on the VPS (gitignored) — rotate secrets there directly.
- Make the three GHCR packages (`...-backend`, `...-ml-service`, `...-frontend`) public once,
  from the repo owner's GitHub → Packages page, so the VPS never needs a PAT to pull.
- `SecurityConfig.java`'s CSRF-disable comment flags that it needs a real look before a
  security-sensitive production deployment — this gets the stack *running*, it doesn't resolve
  that.
- `BATCH_SCORING_CADENCE_CRON` is still `TBD` per the codebase's own ADRs; set a real cron
  expression in `.env.prod` once decided.
- Postgres data lives in a named Docker volume (`postgres_data`) — back it up
  (`docker compose exec postgres pg_dump ...`) before any `docker compose down -v`.
- This VPS has only 1 vCPU / ~4GB RAM shared with another project — keep an eye on
  `free -h` / `docker stats` after deploying; nothing here was sized against a load test.
