#!/bin/bash
set -euo pipefail

REMOTE="hetzner"
PROJECT_DIR="/opt/kurweball"

echo "=== Kurweball Deploy ==="

# 1. Push latest code
echo "[1/4] Pushing to remote..."
git push origin master

# 2. Pull on server
echo "[2/4] Pulling on server..."
ssh "$REMOTE" "cd $PROJECT_DIR && git pull origin master"

# 3. Build and start containers
echo "[3/4] Building and starting containers..."
ssh "$REMOTE" "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d"

# 4. Health check
echo "[4/4] Verifying health..."
sleep 10
HEALTH=$(ssh "$REMOTE" "curl -sf http://localhost:3001/api/health || echo 'FAILED'")
echo "Health: $HEALTH"

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "=== Deploy successful! ==="
else
  echo "=== WARNING: Health check failed ==="
  ssh "$REMOTE" "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml logs --tail=50"
  exit 1
fi
