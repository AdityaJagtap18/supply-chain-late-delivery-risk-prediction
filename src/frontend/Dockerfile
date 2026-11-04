# Phase 1 skeleton build. Multi-stage: build the static Angular bundle with Node, serve it with
# nginx — independent of whatever Node version is (or isn't) installed on the host.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Replaces the default server block: listens on this project's convention (4200, not nginx's
# default 80) and adds the SPA fallback Angular's client-side router needs (a real bug found
# while verifying Phase 3's /orders/:orderId route -- see src/frontend/README.md).
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
