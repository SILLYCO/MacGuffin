# IT Asset Tracker

A production-ready internal IT asset management application for tracking company laptops, hardware specs, status lifecycle, and employee device assignments. Built for portfolio-quality standards and seamless Vercel deployment.

---

## 🌟 Key Features

- **Device Lifecycle & Inventory**: Full tracking of company laptops including Brand, Model, CPU, RAM, Storage, Serial Number, Purchase Date, Warranty Expiration, and Status (`IN_STOCK`, `ASSIGNED`, `IN_REPAIR`, `RETIRED`).
- **Employee Directory**: Manage staff records (Name, Work Email, Department) and view active device assignments.
- **Assignment Audit History**: Immutable append-only log tracking all device assignments over time (who held which device, assigned date, and unassigned date).
- **Business Rule Enforcement**:
  - An employee can have at most **ONE active laptop assignment** at a time.
  - A device can have at most **ONE active employee assignment** at a time (status automatically `ASSIGNED`).
  - Reassigning a device automatically closes previous assignment logs cleanly.
  - Manual status changes (`IN_STOCK`, `IN_REPAIR`, `RETIRED`) require unassigning the device first.
- **Hardware Spec Dropdowns**: CPU, RAM, and Storage options populated from pre-configured constants.
- **Role-Based Access Control (RBAC)**:
  - **IT Administrator (`IT`)**: Full access (Create/Edit/Delete Devices, Employees, User Accounts, Assign/Unassign/Change Status).
  - **Manager (`MANAGER`)**: Read-only access across all devices and employees.
  - Server-side role validation on all Server Actions and API endpoints (403 Forbidden protection).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js) v5 with Credentials Provider & JWT Session Strategy
- **Deployment**: Vercel ready

---

## 🚀 Environment Variables

Copy `.env.example` to `.env` and adjust your configuration:

```bash
# PostgreSQL Connection String (Supabase, Neon, Docker, or Local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/it_asset_db?schema=public"

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

### 2. Generate Prisma Client & Run Database Migrations

Ensure your PostgreSQL database is running, then execute:

```bash
# Generate Prisma Client
pnpm prisma:generate

# Push schema to PostgreSQL database
pnpm prisma db push
```

### 3. Seed Initial IT Administrator & Sample Data

Run the database seed script to populate the initial IT Administrator account (read from `INITIAL_IT_EMAIL` and `INITIAL_IT_PASSWORD`) along with sample employees and devices:

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

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into Vercel.
3. Add Environment Variables in Vercel Project Settings:
   - `DATABASE_URL` (e.g. Supabase or Neon PostgreSQL connection URL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (Your Vercel deployment URL)
4. Deploy! Next.js build script automatically executes `prisma generate && next build`.
