# syntax=docker/dockerfile:1

# ── Stage 1: Build the static SPA ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV VITE_API_BASE=""
RUN npm run build

# ── Stage 2: Serve with zero-config Node server ──────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Install 'serve', a simple static file server
RUN npm install -g serve

# Copy the built files from Stage 1
COPY --from=build /app/dist ./dist

# serve runs on 3000 by default
EXPOSE 3000

# Run serve on the dist folder, routing all unknown requests to index.html (-s)
CMD ["serve", "-s", "dist", "-l", "3000"]