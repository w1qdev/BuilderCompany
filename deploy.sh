#!/bin/bash

# Deployment script for VPS
# Builds Next.js on the host (avoids large node_modules layers in Docker),
# then packages only the standalone output into a minimal Docker image.
#
# Prerequisites: node 20+ installed on host (apt install nodejs)
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

# Step 1: Install all deps (dev + prod needed for next build)
echo "[1/6] Installing dependencies..."
cp .env.production .env
npm install --no-audit --no-fund
npx prisma generate

# Step 2: Build Next.js
echo "[2/6] Building Next.js..."
NODE_OPTIONS="--max-old-space-size=728" NODE_ENV=production npm run build

# Step 3: Build Max bot
echo "[3/6] Building Max bot..."
cd bot
npm install --no-audit --no-fund
npx prisma generate --schema=../prisma/schema.prisma
npx tsc
cd ..

# Step 4: Run database migrations and seed on host
echo "[4/6] Running database migrations..."
DATABASE_URL="file:$(pwd)/data/prod.db" npx prisma migrate deploy

echo "  Seeding equipment data..."
DATABASE_URL="file:$(pwd)/data/prod.db" npx tsx prisma/seed-equipment-types.ts
DATABASE_URL="file:$(pwd)/data/prod.db" npx tsx prisma/seed-equipment-subtypes.ts

# Step 5: Stop old containers, clean Docker cache, build minimal images
echo "[5/6] Building Docker images..."
$COMPOSE down || true
docker system prune -f
DOCKER_BUILDKIT=1 $COMPOSE build

# Step 6: Start new containers
echo "[6/6] Starting containers..."
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

# Fix permissions for persistent volumes
chown -R 1001:1001 /usr/csm-center.ru/uploads/ /usr/csm-center.ru/data/ 2>/dev/null || true

echo ""
echo "=== Deploy completed at $(date) ==="
$COMPOSE ps
