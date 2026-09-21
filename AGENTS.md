# IT Asset Tracker — Codebase Knowledge & Developer Guide

## 📌 Project Overview
This repository contains an internal IT asset and infrastructure management application for tracking company computers (laptops, desktop workstations, and servers), swappable modular hardware components, network printers and ink refills, physical network infrastructure and rack port topology, CCTV video surveillance DVR live monitoring and 24h playback, employee hardware custody, IT procurement receipts and expense tracking in Egyptian Pounds (EGP), and system audit logging. Built for enterprise reliability, high performance, security, and portfolio-quality standards.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, React Server Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with dark mode palette, glassmorphism cards, and custom status badges
- **Database & ORM**: PostgreSQL (Supabase / local) with Prisma ORM
- **Connection Management**: PgBouncer transaction pooler (port 6543) for runtime queries, direct session connection (`DIRECT_URL`, port 5432) for Prisma DDL migrations (`db push`)
- **Authentication**: NextAuth.js (Auth.js v5) with Credentials provider (email + `bcryptjs`) & JWT session strategy
- **Video Streaming Gateway**: `go2rtc` with WebRTC / MSE and on-demand FFmpeg transcoding for H.265 streams
- **Audit Logging**: Comprehensive internal audit trail logging actors, entity types, actions, and timestamped JSON metadata

---

## 🗂️ Project Directory Structure

```text
IT asset Tracking app/
├── docker/
│   ├── docker-compose.cctv.yml  # 1-command Docker service for go2rtc gateway (host network mode)
│   ├── go2rtc.yaml              # go2rtc streaming gateway configuration & FFmpeg presets
│   └── README.md                # Video streaming gateway operational instructions
├── prisma/
│   ├── schema.prisma        # Prisma data models (User, Employee, Device, Component, Printer, Network, Camera, AuditLog)
│   └── seed.ts              # Database seed script for initial IT user & demo inventory
├── scripts/
│   ├── seed-cctv-dvr.ts     # Seeds Advision 16-ch DVR, switch port patch, and 16 camera channels
│   ├── seed-network-demo.ts # Seeds network devices and topology patch connections
│   ├── backup-database.ts   # Database backup utility
│   └── restore-database.ts  # Database restore utility
├── src/
│   ├── app/                 # Next.js 15 App Router pages & Server Components
│   │   ├── (auth)/login/    # Email + password authentication page
│   │   ├── audit-logs/      # System audit trail logs viewer & filtering
│   │   ├── cctv/            # CCTV Surveillance Hub (Live Grid, 24h Playback Timeline, Camera Settings)
│   │   ├── components/      # Modular component inventory, [id] details & custody, creation, & stock management
│   │   ├── dashboard/       # Metric summary counts, fleet allocation, and hardware stream
│   │   ├── devices/         # Computer inventory (Laptops & Desktops), details, edit, & creation
│   │   ├── employees/       # Employee directory, hardware custody breakdown, edit, & creation
│   │   ├── network/         # Network topology map, rack switch ports patcher, & device manager
│   │   ├── printers/        # Network printers directory, ink refills history, edit, & registration
│   │   ├── purchases/       # IT Procurement receipts, expense tracking, invoice details, & receipt builder
│   │   ├── settings/users/  # IT-only User account management & employee linking
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth handler route
│   │   │   └── cctv/        # WebRTC signaling, playback transcode, & recording search routes
│   │   ├── globals.css      # Custom Tailwind CSS & glassmorphism variables
│   │   └── layout.tsx       # Root HTML & body layout wrapper
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar navigation, Navbar header
│   │   ├── ui/              # StatusBadge, RoleBadge, and reusable UI elements
│   │   ├── cctv/            # CctvViewHub, LiveCameraGrid, CameraTile, FullScreenModal, PlaybackTimelineView, CameraAdminTable, useWebRtcStream
│   │   ├── components/      # ComponentTable, ComponentModal, InstallComponentModal, DetachOrTransferModal, ComponentDetailView
│   │   ├── devices/         # DeviceTable, DeviceForm, ReassignModal, ChangeStatusModal, DeviceInstalledComponentsCard
│   │   ├── employees/       # EmployeeTable, EmployeeForm
│   │   ├── network/         # NetworkDeviceTable, NetworkDeviceModal, PatchPortModal, TopologyCanvas
│   │   ├── printers/        # PrinterTable, PrinterForm, InkRefillModal
│   │   ├── purchases/       # PurchaseTable, PurchaseForm, PurchaseDetailView
│   │   └── users/           # UserTable component, user creation modal, & password reset modal
│   ├── lib/
│   │   ├── actions/         # Server Actions (cctv.ts, network.ts, devices.ts, employees.ts, components.ts, printers.ts, purchases.ts, users.ts)
│   │   ├── cctv/            # CCTV server-only clients (dvr-client.ts, gateway-client.ts, queries.ts, types.ts)
│   │   ├── db.ts            # PrismaClient singleton instance
│   │   ├── auth.ts          # NextAuth configuration & Credentials provider
│   │   ├── auth.config.ts   # Edge-compatible NextAuth middleware callbacks
│   │   ├── audit.ts         # Centralized audit logging utility (logAuditAction)
│   │   ├── permissions.ts   # Server-side role validation helpers (requireITRole, getCurrentUser)
│   │   └── constants.ts     # Hardware dropdowns, component maps, category definitions, and EGP currency formatter
│   ├── types/
│   │   └── next-auth.d.ts   # NextAuth Session & JWT type extensions (role, employeeId)
│   └── middleware.ts        # Next.js edge route protection middleware
├── .env.example             # Template environment variables (including CCTV & go2rtc)
├── package.json             # NPM scripts & dependencies
├── README.md                # General setup & deployment documentation
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 🔑 Data Models & Relations (`schema.prisma`)

1. **`User`**:
   - `id`: CUID String primary key
   - `email`: String (unique)
   - `passwordHash`: String (`bcryptjs`)
   - `role`: Enum `Role` (`IT` | `MANAGER`)
   - `employeeId`: String? (unique nullable FK to `Employee`)
   - Relations: `auditLogs`.
2. **`Employee`**:
   - `id`: CUID String primary key
   - `name`: String
   - `email`: String (unique)
   - `department`: String
   - Relations: Optional `User` link, has many `Assignment` records.
3. **`Device`**:
   - `id`: CUID String primary key
   - `deviceType`: Enum `DeviceType` (`LAPTOP`, `DESKTOP_PC`, `WORKSTATION`, `SERVER`)
   - `brand`, `model`, `cpu`, `ram`, `storage`: String hardware specs
   - `serialNumber`: String (unique)
   - `purchaseDate`, `warrantyExpiry`: DateTime?
   - `status`: Enum `DeviceStatus` (`IN_STOCK` | `ASSIGNED` | `IN_REPAIR` | `RETIRED`)
   - Relations: Has many `Assignment` records, has many mounted `Component` records, `networkConnections`.
4. **`Assignment`**:
   - `id`: CUID String primary key
   - `deviceId`: FK to `Device`
   - `employeeId`: FK to `Employee`
   - `assignedAt`: DateTime (default `now()`)
   - `unassignedAt`: DateTime? (`null` indicates active assignment)
5. **`Component`**:
   - `id`: CUID String primary key
   - `type`: Enum `ComponentType` (`RAM`, `STORAGE_SSD`, `STORAGE_HDD`, `GPU`, `CPU`, `MOTHERBOARD`, `POWER_SUPPLY`, `NETWORK_CARD`, `PERIPHERAL_MOUSE`, `PERIPHERAL_KEYBOARD`, `PERIPHERAL_MONITOR`, `CABLES_ADAPTERS`, `OTHER`)
   - `brand`, `model`: String
   - `capacity`, `specs`: String? (e.g. "16 GB", "DDR4 3200MHz")
   - `serialNumber`: String (unique)
   - `status`: Enum `ComponentStatus` (`IN_STOCK`, `INSTALLED`, `DEFECTIVE`, `RETIRED`)
   - `deviceId`: String? FK to `Device` (host machine)
   - `purchaseItemId`: String? FK to `PurchaseItem`
   - `purchasePrice`: Float? in EGP
   - Relations: `transfers` (`ComponentTransfer[]`).
6. **`ComponentTransfer`**:
   - `id`: CUID String primary key
   - `componentId`: FK to `Component`
   - `fromDeviceId`, `toDeviceId`: String? FKs to `Device`
   - `fromDeviceName`, `toDeviceName`: String? snapshot names
   - `actionType`: Enum `ComponentTransferAction`
   - `reason`: String?
   - `performedByEmail`: String
   - `transferredAt`: DateTime (default `now()`)
7. **`Printer` & `PrinterInkRefill`**:
   - `Printer`: `id`, `brand`, `model`, `serialNumber`, `location`, `ipAddress`, `macAddress`, `connectionType`, `colorSupport`, `duplexSupport`, `status`, `lastRefillDate`, `networkConnections`.
   - `PrinterInkRefill`: `id`, `printerId`, `refillDate`, `notes`, `refilledByEmail`.
8. **`NetworkDevice` & `NetworkConnection`**:
   - `NetworkDevice`: `id`, `name`, `deviceType` (`ROUTER`, `SWITCH`, `ACCESS_POINT`, `FIREWALL`, `PATCH_PANEL`, `DVR_NVR`, `OTHER`), `brand`, `model`, `ipAddress`, `macAddress`, `location`, `totalPorts`, `status`, `notes`. Relations: `outgoingConnections`, `incomingConnections`, `cameraDevice`.
   - `NetworkConnection`: `fromDeviceId`, `fromPort`, `fromPortLabel`, destination links (`targetNetworkDeviceId` / `targetDeviceId` / `targetPrinterId` / `endpointName`), `cableType`, `cableColor`, `speed`, `vlan`, `wallOutlet`, `notes`.
9. **`CameraDevice` & `CameraChannel`**:
   - `CameraDevice`: `id`, `name`, `brand`, `model`, `host` (`192.168.1.114`), `rtspPort` (554), `httpPort` (80), `totalChannels` (16), `location`, `enabled`, `notes`, `networkDeviceId` (linked to physical switch port). Relations: `channels`.
   - `CameraChannel`: `id`, `cameraDeviceId`, `channelNumber` (1..16), `name`, `location`, `transcodeSub`, `sortOrder`, `enabled`, `notes`.
10. **`Purchase` & `PurchaseItem`**:
    - `Purchase`: `id`, `title`, `vendor`, `invoiceNumber`, `purchaseDate`, `totalAmount`, `currency` ("EGP"), `notes`, `purchasedBy`.
    - `PurchaseItem`: `id`, `purchaseId`, `name`, `category` (`PurchaseCategory`), `unitPrice`, `quantity`, `totalPrice`, `isTracked`, `autoStocked`, `notes`.
11. **`AuditLog`**:
    - `id`, `action` (`DEVICE_*`, `EMPLOYEE_*`, `USER_*`, `PRINTER_*`, `COMPONENT_*`, `PURCHASE_*`, `NETWORK_*`, `CCTV_STREAM_VIEWED`, `CCTV_PLAYBACK_VIEWED`, `CCTV_RECORDING_SEARCHED`, `CCTV_CONFIG_UPDATED`), `entityType`, `entityId`, `entityName`, `actorId`, `actorEmail`, `actorRole`, `details` (JSON String), `createdAt`.

---

## 🔒 Business Logic & Architecture Constraints

- **Assignment Constraint**: An employee can hold at most **1 active laptop/computer** (`unassignedAt = null`). Reassigning automatically closes previous assignments (`unassignedAt = now()`) and updates device status to `ASSIGNED`.
- **Manual Status Changes**: A computer's status can only be manually changed to `IN_STOCK`, `IN_REPAIR`, or `RETIRED` when it has **no active assignment**.
- **Dynamic Specs Aggregation**: In "Modular-Auto Calculated" mode for desktop PCs, total RAM and Storage are computed in real time from mounted `Component` records.
- **Component Custody Tracking**: Components mounted into an assigned computer follow that computer's assignment. Employee profiles (`/employees/[id]`) display every physical part currently in the employee's custody.
- **Tracked Assets vs. Untracked Consumables**:
  - Tracked items (RAM, SSD, GPU, Mouse, Keyboard, Monitor) can auto-generate `Component` stock in the IT closet with serial tags upon receipt creation, or be stocked manually later.
  - Untracked items (keyboard stickers, thermal paste, cleaning kits) are logged strictly for accounting and receipt proof; no component records are created.
- **CCTV Security & WebRTC Streaming Architecture**:
  - **Zero Credentials Exposure**: DVR credentials reside strictly in server environment variables (`DVR_HOST`, `DVR_USER`, `DVR_PASS`) and are never sent to client bundles or logged. Passwords with `@` are automatically URL-encoded (`encodeURIComponent`) in RTSP URIs.
  - **Dahua HTTP Digest Client**: Recording search uses RFC 2617 / RFC 7616 Digest Auth with 4-step sequence (`factory.create` ➔ `findFile` ➔ `findNextFile` ➔ `close` & `destroy`), guaranteed cleanup in `try...finally` to prevent object handle leaks.
  - **Codec Compatibility**: Channel 1 sub-stream is H.264B (direct passthrough). Channels 2..16 sub-streams and all playback streams are H.265, transcoded on-demand by `go2rtc` using FFmpeg (`#video=h264`) with `-v fatal` and `-err_detect ignore_err` to prevent HEVC missing POC reference errors.
- **Supabase PgBouncer Pooler Compatibility**:
  - Server actions (`devices.ts`, `employees.ts`, `purchases.ts`, `components.ts`, `printers.ts`, `network.ts`, `cctv.ts`) use **direct sequential queries** instead of interactive `db.$transaction(async (tx) => ...)`.
  - This prevents `P2028` connection drops and rollbacks caused by PgBouncer transaction-mode connection cycling on port 6543.
- **Role Enforcement (RBAC)**:
  - `IT`: Full CRUD across all modules (Devices, Employees, Components, Printers, Purchases, Network, CCTV settings, User Accounts).
  - `MANAGER`: Read-only access across all views.
  - All mutations enforce server-side validation via `requireITRole()`, throwing a `403 Forbidden` error for unauthorized requests.

---

## 🚀 Key Commands

```bash
# Start development server (http://localhost:3000)
pnpm dev

# Run production build and verify type safety
pnpm build

# Push database schema changes to PostgreSQL (using DIRECT_URL session mode)
pnpm exec prisma db push

# Generate Prisma Client
pnpm exec prisma generate

# Seed initial IT administrator & demo inventory
pnpm prisma:seed

# Seed CCTV DVR & 16-channel cameras with switch port linkage
pnpm prisma:seed:cctv

# Seed physical network devices and topology patch connections
pnpm tsx scripts/seed-network-demo.ts

# Start go2rtc video streaming gateway via Docker
docker compose -f docker/docker-compose.cctv.yml up -d

# Stop go2rtc video streaming gateway
docker compose -f docker/docker-compose.cctv.yml down
```
