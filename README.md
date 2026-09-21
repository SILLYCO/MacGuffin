# IT Asset Tracker

A production-ready internal IT asset and infrastructure management application for tracking company computers (laptops, desktops, workstations, and servers), swappable modular hardware components, network printers and ink refills, physical network infrastructure and rack port topology, CCTV video surveillance DVR live monitoring and 24-hour playback, employee hardware custody, IT procurement receipts and expenses in Egyptian Pounds (EGP), and system audit logs.

Built for enterprise reliability, high performance, security, and portfolio-quality standards.

---

## 🌟 Key Features

### 1. Computer Fleet & Workstations (`/devices`)
- **Multi-Device Type Support**: Track **Laptops**, **Desktop PCs**, **Workstation Towers**, and **Server Hosts**.
- **Dynamic Specs Aggregation**: Compute RAM and Storage capacities dynamically in real time from mounted modular components, or specify static specs.
- **Full Lifecycle Statuses**: `IN_STOCK`, `ASSIGNED`, `IN_REPAIR`, `RETIRED`.
- **Inline Parts Mounting**: Register brand new parts or mount spare components from the IT closet directly during computer creation.

### 2. Modular Components & Spare Parts Shelf (`/components`)
- **Supported Hardware & Peripherals**: RAM, SSDs, HDDs, GPUs, CPUs, Motherboards, Power Supplies, Network Cards, Mice, Keyboards, Monitors, Cables & Adapters.
- **Dedicated Component Details Screen (`/components/[id]`)**: Full hardware profile, linked procurement invoice / EGP cost, current placement, and quick actions to install, detach, or hot-swap.
- **Physical Shelf Inventory**: Monitor available spare parts sitting on the shelf vs. parts installed inside PCs.
- **End-to-End Custody Tracking**: Instantly see which employee has custody of any installed component through their host machine.
- **Chronological Transfer History**: Complete audit trail for every component installation, detachment, swap, or retirement.

### 3. Physical Network Infrastructure & Port Topology (`/network`)
- **Network Devices & Switches**: Manage **Routers**, **Core/Access Switches**, **Access Points**, **Firewalls**, **Patch Panels**, and **DVR/NVR Surveillance Units**.
- **Rack Port Patching Matrix**:
  - Track individual port numbers, custom labels, port status (`FREE`, `IN_USE`, `DISABLED`, `TRUNK`), and speed (100M, 1G, 2.5G, 10G).
  - Cable specifications: Cable types (CAT5e, CAT6, CAT6A, Fiber SM/MM), color coding (Blue, Yellow, Green, Red, Orange, Purple), and wall outlet/faceplate numbering.
  - Endpoints: Patch ports to other network hardware, employee workstations/laptops, network printers, or unmanaged endpoints.
- **Interactive SVG Topology Canvas**:
  - Real-time graphical map of the entire physical network hierarchy.
  - Interactive pan, smooth zoom controls, node-type filtering, and dynamic link highlighting.
  - Visual status badges and quick-inspect popovers for port allocations and device health.

### 4. CCTV Video Surveillance & 24h Playback (`/cctv`)
- **DVR Hardware & Switch Port Integration**:
  - Advision 16-channel 1080N XVR integrated using Dahua CGI HTTP Digest protocol.
  - Physically mapped to Switch 1 Port 16 for complete network-to-camera traceability.
- **Live Fleet Camera Grid**:
  - Responsive multi-camera matrix supporting **1×1**, **2×2**, **3×3**, and **4×4** layouts.
  - Low-latency sub-second WebRTC video streaming powered by `go2rtc`.
  - Bandwidth-efficient `IntersectionObserver` lazy streaming: off-screen video tracks automatically pause to conserve CPU and network traffic.
- **Full-Screen 1080N High-Definition View**:
  - Instant modal transition to high-definition 1080N main stream.
  - Live PNG snapshot capture and instant local export for security incident documentation.
- **24-Hour Visual Playback Timeline**:
  - Interactive 24-hour visual timeline bar with color-coded recording slices (**General**, **Motion Detection**, **Alarm**).
  - Click-to-seek historical playback with direct Dahua `.dav` stream negotiation.
  - On-demand H.265 to H.264 FFmpeg transcoding with corrupted reference frame recovery (`-v fatal -err_detect ignore_err`) for seamless HTML5 video rendering.
- **DVR Diagnostics & Administration**:
  - Real-time diagnostic ping and HTTP Digest authentication verification.
  - Channel name, location, switch port link, and transcode mode configuration.

### 5. IT Purchases & Expense Tracking (`/purchases`)
- **Financial Tracking in EGP**: All purchase orders, line items, and totals are computed in Egyptian Pounds (`formatEGP()`).
- **Tracked Assets vs. Untracked Supplies**:
  - **Tracked Hardware Assets** (RAM, SSD, GPU, Mouse, Keyboard, Monitor): Option to auto-generate physical components with serial tags into the IT inventory closet upon receipt creation, or stock them later.
  - **Untracked Consumables / Proof-of-Purchase** (keyboard stickers, thermal paste, cleaning kits): Recorded purely for accounting and receipt proof without cluttering the hardware inventory.
- **Interactive Receipt Builder**: Dynamic line item calculation, live grand totals, vendor suggestions, invoice printing, and cascade deletion.
- **Category Synchronization**: 1:1 parity between purchase receipt categories and swappable component categories.

### 6. Network Printers & Ink Maintenance (`/printers`)
- **Printer Directory**: Track brand, model, IP address, MAC address, physical office location, color support, duplex printing, and status (`WORKING` | `IN_REPAIR`).
- **Ink & Toner Refill Log**: Complete historical record of ink/toner refills with dates, technician notes, and performer email.

### 7. Staff Directory & Hardware Custody (`/employees`)
- **Employee Directory**: Manage company personnel across departments.
- **Active Computer Allocation**: Enforces the business rule that an employee can hold at most **1 active computer**.
- **Hardware In Possession**: Detailed breakdown on employee profile pages showing every individual RAM stick, SSD, GPU, and peripheral inside the employee's machine.

### 8. System Audit Logs (`/audit-logs`)
- **Immutable Audit Trail**: Logs all system events (`DEVICE_*`, `EMPLOYEE_*`, `USER_*`, `PRINTER_*`, `COMPONENT_*`, `PURCHASE_*`, `NETWORK_*`, `CCTV_*`) with actor metadata, affected entities, and JSON change details.

### 9. User Management & Access Control (`/settings/users`)
- **Role-Based Access Control (RBAC)**:
  - **IT Administrator (`IT`)**: Full CRUD access across all inventory, devices, printers, network topology, CCTV settings, and user accounts.
  - **Manager (`MANAGER`)**: Read-only visibility across all views.
- **Password Reset**: IT administrators can securely reset passwords for internal accounts.
- **Server-Side Protection**: All Server Actions enforce `requireITRole()` checks with `403 Forbidden` protection.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, React Server Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with dark mode palette & custom status badges
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Database Connection**: PgBouncer transaction pooler (port 6543) for runtime queries, direct session connection (`DIRECT_URL`, port 5432) for schema pushes
- **Authentication**: NextAuth.js (Auth.js v5) with Credentials provider (email + `bcryptjs`) & JWT session strategy
- **Video Streaming Gateway**: `go2rtc` with WebRTC / MSE and on-demand FFmpeg transcoding for H.265 streams
- **Network Topology Canvas**: Interactive custom SVG visualization with zoom, pan, and dynamic link routing
- **Deployment**: Vercel ready

---

## 🚀 Environment Variables

Create a `.env.local` or `.env` file based on `.env.example`:

```bash
# PostgreSQL Connection String (PgBouncer Transaction Mode - Port 6543)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"

# Direct PostgreSQL Connection String (Session Mode - Port 5432 for Prisma db push)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"

# Initial IT Administrator (Seeded into DB)
INITIAL_IT_EMAIL="admin@company.com"
INITIAL_IT_PASSWORD="AdminPassword123!"

# CCTV Surveillance DVR & Video Streaming Gateway
DVR_HOST="192.168.1.114"
DVR_RTSP_PORT="554"
DVR_HTTP_PORT="80"
DVR_USER="admin"
DVR_PASS="your-dvr-password"
GO2RTC_API_URL="http://127.0.0.1:1984"
```

> **Security Note**: DVR credentials reside strictly on the server (`process.env`) and are never sent to client browser bundles. Passwords with special characters (such as `@`) are automatically URL-encoded in RTSP connection URIs.

---

## 📹 Video Streaming Gateway Setup (`go2rtc`)

The application uses `go2rtc` to bridge RTSP video feeds into low-latency WebRTC streams.

### Option A: Run via Docker Compose (Recommended)

From the project root directory, run:

```bash
# Start go2rtc gateway container in host network mode
docker compose -f docker/docker-compose.cctv.yml up -d

# View real-time streaming logs
docker logs -f it-asset-go2rtc

# Stop the gateway container
docker compose -f docker/docker-compose.cctv.yml down
```

### Option B: Run as Native Linux Binary

```bash
# 1. Download standalone binary
curl -L https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_linux_amd64 -o go2rtc
chmod +x go2rtc

# 2. Start with project configuration
./go2rtc -config docker/go2rtc.yaml
```

The gateway API will be immediately available on `http://127.0.0.1:1984`.

---

## ⚙️ Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Generate Prisma Client & Push Database Schema

```bash
# Generate Prisma Client
pnpm exec prisma generate

# Push schema to PostgreSQL database (uses DIRECT_URL)
pnpm exec prisma db push
```

### 3. Seed Initial IT Administrator & Demo Inventory

```bash
pnpm prisma:seed
```

### 4. Seed Physical Network & CCTV DVR (Optional)

```bash
# Seed switch racks, patch panel ports, and physical topology connections
pnpm tsx scripts/seed-network-demo.ts

# Seed Advision 16-channel DVR and camera channels patched to Switch 1 Port 16
pnpm prisma:seed:cctv
```

### 5. Start the Video Streaming Gateway

```bash
docker compose -f docker/docker-compose.cctv.yml up -d
```

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts (Default Seed)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **IT Administrator** | `admin@company.com` | `AdminPassword123!` | Full CRUD & User Management across all modules |
| **Manager** | `manager@company.com` | `ManagerPass123!` | Read-Only Access across all modules |

---

## 📦 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into Vercel.
3. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL` (Supabase PgBouncer URL on port 6543)
   - `DIRECT_URL` (Supabase direct connection on port 5432)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Your production Vercel domain)
   - `DVR_*` and `GO2RTC_API_URL` (Pointing to your LAN / VPN streaming gateway)
4. Deploy! Next.js build automatically executes `prisma generate && next build`.
