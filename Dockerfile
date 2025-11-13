# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-bookworm-slim AS build

# Install build tools for native deps (e.g., node-gyp, microtime)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Set workdir to the app folder inside the repo
WORKDIR /app/solid-watchparty

# Install deps first (better layer caching)
COPY solid-watchparty/package*.json ./
RUN npm ci

# Copy source and build
COPY solid-watchparty/ ./
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

# Copy nginx config for SPA routing at root
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx root (served at /)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
