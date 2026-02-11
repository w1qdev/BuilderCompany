#!/bin/bash

# Backup script for database and uploads
# Usage: ./backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${TIMESTAMP}"

echo "📦 Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup archive
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='backups' \
    data/ \
    uploads/ \
    .env.production 2>/dev/null || true

echo "✅ Backup created: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "📊 Backup size: $(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t backup_*.tar.gz | tail -n +8 | xargs -r rm --

echo "✅ Backup complete!"
ls -lh backup_*.tar.gz | tail -7
