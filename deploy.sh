#!/bin/bash

# Deployment script for VPS
# Usage: ./deploy.sh
#
# Workflow: git pull && ./deploy.sh
# Builds new image while old container is still serving traffic,
# then does a quick swap (~5-15 sec downtime).

set -e

APP_CONTAINER="csm-app"
COMPOSE="docker compose"

# Fallback to docker-compose (v1) if docker compose (v2) is not available
if ! docker compose version &>/dev/null; then
    COMPOSE="docker-compose"
fi

echo "=== Deploy started at $(date) ==="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

# Step 0: Stop old container and clean up to free space for build
echo "[0/4] Stopping old container and freeing disk space..."
$COMPOSE down || true
docker system prune -f

# Step 1: Build new image
echo "[1/4] Building new image..."
DOCKER_BUILDKIT=1 $COMPOSE build

# Step 2: Start new container
echo "[2/4] Starting new container..."
$COMPOSE up -d --force-recreate --no-build

# Step 3: Wait for the new container to become healthy
echo "[3/4] Waiting for health check..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo "unknown")
    if [ "$HEALTH" = "healthy" ]; then
        echo "Container is healthy!"
        break
    fi
    # Also accept "starting" with a successful curl as healthy enough
    if [ "$HEALTH" = "starting" ] && wget -q --spider http://localhost:3000 2>/dev/null; then
        echo "Container is responding (health check still warming up)."
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "  Waiting... ($ATTEMPTS/$MAX_ATTEMPTS, status: $HEALTH)"
    sleep 5
done

if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "WARNING: Container did not become healthy in time."
    echo "Showing recent logs:"
    $COMPOSE logs --tail=30
    exit 1
fi

# Step 4: Cleanup old images
echo "[4/4] Cleaning up old images..."
docker image prune -f

echo ""
echo "=== Deploy completed at $(date) ==="
$COMPOSE ps
