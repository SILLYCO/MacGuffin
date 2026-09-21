# CCTV DVR Video Streaming Gateway (go2rtc)

This directory contains the deployment setup for the **`go2rtc`** streaming gateway used by the IT Asset Tracker to convert Dahua/Advision RTSP streams into sub-second WebRTC and MSE video in web browsers.

---

## 🚀 Option 1: Run with Docker Compose (Recommended on Linux)

Run the following command in your terminal from the project root:

```bash
docker compose -f docker/docker-compose.cctv.yml up -d
```

To view streaming logs:
```bash
docker logs -f it-asset-go2rtc
```

To stop the gateway:
```bash
docker compose -f docker/docker-compose.cctv.yml down
```

---

## 💻 Option 2: Run as Native Linux Binary (Without Docker)

1. Download the standalone executable:
```bash
curl -L https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_linux_amd64 -o go2rtc
chmod +x go2rtc
```

2. Run with our configuration:
```bash
./go2rtc -config docker/go2rtc.yaml
```

The gateway API will be immediately live on `http://127.0.0.1:1984`.

---

## 🔒 Security & Environment Variables

Add your DVR credentials to `.env.local`:

```env
# CCTV DVR Settings (Kept strictly on the server; never exposed to browsers)
DVR_HOST="192.168.1.114"
DVR_RTSP_PORT="554"
DVR_HTTP_PORT="80"
DVR_USER="admin"
DVR_PASS="your-dvr-password"
GO2RTC_API_URL="http://127.0.0.1:1984"
```

> **Note**: If your DVR password contains special characters like `@`, the application automatically URL-encodes it when negotiating RTSP streams.
