#!/usr/bin/env bash

# Resolve project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🛑 Stopping CCTV Cloudflare Tunnels..."

if [ -f /tmp/cctv_tunnels.pid ]; then
  kill $(cat /tmp/cctv_tunnels.pid) 2>/dev/null || true
  rm -f /tmp/cctv_tunnels.pid
fi

pkill -f "cloudflared tunnel --url http://127.0.0.1:1984" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://192.168.1.114:80" 2>/dev/null || true

echo "✅ CCTV Tunnels stopped."

if [ "$1" == "--with-container" ]; then
  echo "📦 Stopping go2rtc Docker container..."
  docker compose -f docker/docker-compose.cctv.yml down
  echo "✅ go2rtc container stopped."
fi
