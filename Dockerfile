# syntax=docker/dockerfile:1

# ── Stage 1: Build the static SPA ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV VITE_API_BASE=""
RUN npm run build

# ── Stage 2: Serve with nginx, reverse-proxying /api to the backend ──────────
FROM nginx:1.27-alpine AS runtime

# Copy the built static assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Rendered at container start by nginx's built-in envsubst entrypoint, which
# substitutes ${BACKEND_URL} (and only env vars that are actually set).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default so the image still runs standalone; override at deploy time.
ENV BACKEND_URL="http://host.docker.internal:8080"

EXPOSE 80