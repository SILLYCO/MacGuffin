#!/usr/bin/env bash

# Resolve project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

CLOUDFLARED_BIN="$PROJECT_ROOT/cloudflared"

if [ ! -f "$CLOUDFLARED_BIN" ]; then
  if command -v cloudflared &> /dev/null; then
    CLOUDFLARED_BIN=$(command -v cloudflared)
  else
    echo "❌ Error: cloudflared binary not found in $PROJECT_ROOT"
    exit 1
  fi
fi

echo "=================================================="
echo "🎥 CCTV DVR & Video Streaming Gateway Launcher"
echo "=================================================="

# 1. Start Docker Container
echo ""
echo "📦 Step 1/3: Starting go2rtc Docker container..."
docker compose -f docker/docker-compose.cctv.yml up -d

# Verify go2rtc local port 1984
sleep 2
if ! curl -s -f http://127.0.0.1:1984/api/streams > /dev/null; then
  echo "⚠️ Warning: go2rtc API not yet responding on http://127.0.0.1:1984. Waiting 3 seconds..."
  sleep 3
fi

# 2. Terminate existing tunnels if running
pkill -f "cloudflared tunnel --url http://127.0.0.1:1984" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://192.168.1.114:80" 2>/dev/null || true

# 3. Launch Tunnels in Background
GO2RTC_LOG="/tmp/cctv_tunnel_go2rtc.log"
DVR_LOG="/tmp/cctv_tunnel_dvr.log"
rm -f "$GO2RTC_LOG" "$DVR_LOG"

echo ""
setsid "$CLOUDFLARED_BIN" tunnel --url http://127.0.0.1:1984 > "$GO2RTC_LOG" 2>&1 < /dev/null &
GO2RTC_PID=$!

setsid "$CLOUDFLARED_BIN" tunnel --url http://192.168.1.114:80 > "$DVR_LOG" 2>&1 < /dev/null &
DVR_PID=$!

echo "$GO2RTC_PID $DVR_PID" > /tmp/cctv_tunnels.pid

# Wait up to 15 seconds for trycloudflare URLs to generate
echo "⏳ Waiting for public tunnel URLs..."
GO2RTC_URL=""
DVR_URL=""

for i in {1..15}; do
  if [ -z "$GO2RTC_URL" ] && [ -f "$GO2RTC_LOG" ]; then
    GO2RTC_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$GO2RTC_LOG" | head -n 1)
  fi
  if [ -z "$DVR_URL" ] && [ -f "$DVR_LOG" ]; then
    DVR_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$DVR_LOG" | head -n 1)
  fi

  if [ -n "$GO2RTC_URL" ] && [ -n "$DVR_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$GO2RTC_URL" ] || [ -z "$DVR_URL" ]; then
  echo "❌ Failed to retrieve Cloudflare tunnel URLs. Check logs at:"
  echo "   $GO2RTC_LOG"
  echo "   $DVR_LOG"
  exit 1
fi

# 4. Update .env.local and .env.vercel
echo ""
echo "📝 Step 3/3: Updating environment configurations..."

# Read existing DVR credentials from .env.local if present, or fallback to defaults
CURRENT_DVR_USER="${DVR_USER:-admin}"
CURRENT_DVR_PASS="${DVR_PASS}"
if [ -z "$CURRENT_DVR_PASS" ] && [ -f "$PROJECT_ROOT/.env.local" ]; then
  CURRENT_DVR_PASS=$(grep -E "^DVR_PASS=" "$PROJECT_ROOT/.env.local" | cut -d'=' -f2- | tr -d '"'\''')
fi
if [ -z "$CURRENT_DVR_PASS" ]; then
  CURRENT_DVR_PASS="your-dvr-password"
fi

cat <<EOF > "$PROJECT_ROOT/.env.vercel"
# New CCTV Surveillance DVR & Tunnel Gateway Configuration
DVR_HOST="192.168.1.114"
DVR_RTSP_PORT="554"
DVR_HTTP_PORT="80"
DVR_USER="$CURRENT_DVR_USER"
DVR_PASS="$CURRENT_DVR_PASS"
GO2RTC_API_URL="$GO2RTC_URL"
DVR_HTTP_URL="$DVR_URL"
EOF

# Update .env.local
cat <<EOF > "$PROJECT_ROOT/.env.local"
# CCTV DVR Configuration
DVR_HOST="192.168.1.114"
DVR_RTSP_PORT="554"
DVR_HTTP_PORT="80"
DVR_USER="$CURRENT_DVR_USER"
DVR_PASS="$CURRENT_DVR_PASS"
GO2RTC_API_URL="$GO2RTC_URL"
DVR_HTTP_URL="$DVR_URL"
EOF

echo ""
echo "=================================================="
echo "✅ CCTV Tunnels & Gateway Are LIVE!"
echo "=================================================="
echo "🎥 go2rtc Gateway URL : $GO2RTC_URL"
echo "📼 DVR HTTP API URL    : $DVR_URL"
echo ""
echo "📋 Updated .env.vercel with the new URLs automatically!"
echo "   Copy the values below or upload .env.vercel to Vercel:"
echo "--------------------------------------------------"
cat "$PROJECT_ROOT/.env.vercel"
echo "--------------------------------------------------"
echo ""
echo "💡 To stop the tunnels anytime, run:"
echo "   ./scripts/stop-cctv-tunnels.sh"
echo "=================================================="
