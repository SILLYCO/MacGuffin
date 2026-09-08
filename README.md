# IT Asset Tracker

A production-ready internal IT asset and infrastructure management application for tracking company computers (laptops and desktop PCs), swappable modular hardware components, network printers, employee hardware custody, IT procurement receipts and expenses in Egyptian Pounds (EGP), and system audit logs.

Built for enterprise reliability, high performance, security, and seamless Vercel / Supabase deployment.

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

### 3. IT Purchases & Expense Tracking (`/purchases`)
- **Financial Tracking in EGP**: All purchase orders, line items, and totals are computed in Egyptian Pounds (`formatEGP()`).
- **Tracked Assets vs. Untracked Supplies**:
  - **Tracked Hardware Assets** (RAM, SSD, GPU, Mouse, Keyboard, Monitor): Option to auto-generate physical components with serial tags into the IT inventory closet upon receipt creation, or stock them later.
  - **Untracked Consumables / Proof-of-Purchase** (keyboard stickers, thermal paste, cleaning kits): Recorded purely for accounting and receipt proof without cluttering the hardware inventory.
- **Interactive Receipt Builder**: Dynamic line item calculation, live grand totals, vendor suggestions, invoice printing, and cascade deletion.
- **Category Synchronization**: 1:1 parity between purchase receipt categories and swappable component categories.

### 4. Network Printers & Ink Maintenance (`/printers`)
- **Printer Directory**: Track brand, model, IP address, MAC address, physical office location, color support, duplex printing, and status (`WORKING` | `IN_REPAIR`).
- **Ink & Toner Refill Log**: Complete historical record of ink/toner refills with dates, technician notes, and performer email.

### 5. Staff Directory & Hardware Custody (`/employees`)
- **Employee Directory**: Manage company personnel across departments.
- **Active Computer Allocation**: Enforces the business rule that an employee can hold at most **1 active computer**.
- **Hardware In Possession**: Detailed breakdown on employee profile pages showing every individual RAM stick, SSD, GPU, and peripheral inside the employee's machine.

### 6. System Audit Logs (`/audit-logs`)
- **Immutable Audit Trail**: Logs all system events (`DEVICE_CREATED`, `DEVICE_ASSIGNED`, `PURCHASE_CREATED`, `COMPONENT_INSTALLED`, etc.) with actor metadata, affected entities, and JSON change details.

### 7. User Management & Access Control (`/settings/users`)
- **Role-Based Access Control (RBAC)**:
  - **IT Administrator (`IT`)**: Full CRUD access across all inventory, devices, printers, purchases, and user accounts.
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
- **Deployment**: Vercel ready

---

## 🚀 Environment Variables

Create a `.env` file from `.env.example`:

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
```

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

### 3. Seed Initial IT Administrator & Sample Data

```bash
pnpm prisma:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts (Default Seed)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **IT Administrator** | `admin@company.com` | `AdminPassword123!` | Full CRUD & User Management |
| **Manager** | `manager@company.com` | `ManagerPass123!` | Read-Only Access |

---

## 📦 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into Vercel.
3. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL` (Supabase PgBouncer URL on port 6543)
   - `DIRECT_URL` (Supabase direct connection on port 5432)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Your production Vercel domain)
4. Deploy! Next.js build automatically executes `prisma generate && next build`.

