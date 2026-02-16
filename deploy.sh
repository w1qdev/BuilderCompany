#!/bin/bash

# Deployment script for VPS
# Builds Next.js on the host (no node_modules in Docker layers),
# then packages only the standalone output into a minimal Docker image.
#
# Usage: git pull && ./deploy.sh

set -e

APP_CONTAINER="csm-app"
COMPOSE="docker compose"

if ! docker compose version &>/dev/null; then
    COMPOSE="docker-compose"
fi

echo "=== Deploy started at $(date) ==="

if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found!"
    exit 1
fi

# Step 1: Install dependencies and build on host
echo "[1/5] Installing dependencies..."
cp .env.production .env
npm ci --omit=dev --no-audit --no-fund
# Need devDeps for build (next, typescript, etc.)
npm install --no-audit --no-fund
npx prisma generate

echo "[2/5] Building Next.js..."
NODE_OPTIONS="--max-old-space-size=512" NODE_ENV=production npm run build

echo "[2.5/5] Running database migrations..."
DATABASE_URL="file:$(pwd)/data/prod.db" npx prisma migrate deploy

# Step 3: Stop old container and clean Docker cache
echo "[3/5] Stopping old container..."
$COMPOSE down || true
docker system prune -f

# Step 4: Build minimal Docker image (only copies artifacts, no npm install)
echo "[4/5] Building Docker image..."
DOCKER_BUILDKIT=1 $COMPOSE build

# Step 5: Start new container
echo "[5/5] Starting container..."
$COMPOSE up -d --force-recreate --no-build

# Wait for health check
echo "Waiting for health check..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo "unknown")
    if [ "$HEALTH" = "healthy" ]; then
        echo "Container is healthy!"
        break
    fi
    if [ "$HEALTH" = "starting" ] && wget -q --spider http://localhost:3000 2>/dev/null; then
        echo "Container is responding."
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "  Waiting... ($ATTEMPTS/$MAX_ATTEMPTS, status: $HEALTH)"
    sleep 5
done

if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "WARNING: Container did not become healthy in time."
    $COMPOSE logs --tail=30
    exit 1
fi

docker image prune -f

echo ""
echo "=== Deploy completed at $(date) ==="
$COMPOSE ps
