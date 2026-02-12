#!/bin/bash

# Deployment script for VPS
# Usage: ./deploy.sh [docker|pm2]

set -e

DEPLOY_METHOD=${1:-docker}

echo "Starting deployment with method: $DEPLOY_METHOD"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

if [ "$DEPLOY_METHOD" = "docker" ]; then
    echo "Building and deploying with Docker..."

    # Stop existing containers
    docker-compose down

    # Build new image (use cache for faster rebuilds)
    docker-compose build

    # Remove dangling images to free disk space
    docker image prune -f

    # Start containers
    docker-compose up -d

    # Show logs
    echo "Deployment complete! Showing logs..."
    docker-compose logs -f --tail=50

elif [ "$DEPLOY_METHOD" = "pm2" ]; then
    echo "Deploying with PM2..."

    # Install dependencies
    echo "Installing dependencies..."
    npm ci --only=production

    # Generate Prisma Client
    echo "Generating Prisma Client..."
    npx prisma generate

    # Run database migrations
    echo "Running database migrations..."
    npx prisma migrate deploy

    # Build Next.js app
    echo "Building Next.js application..."
    npm run build

    # Create logs directory
    mkdir -p logs

    # Restart PM2
    echo "Restarting PM2 process..."
    pm2 delete csm-app 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save

    # Show status
    echo "Deployment complete!"
    pm2 status
    pm2 logs csm-app --lines 20

else
    echo "Invalid deployment method. Use 'docker' or 'pm2'."
    exit 1
fi
