# IT Asset Tracker — Codebase Knowledge & Developer Guide

## 📌 Project Overview
This repository contains an internal IT asset management application for tracking company laptop devices, hardware specifications, status lifecycles, and employee device assignments. Built for high performance, security, and portfolio-quality standards.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with dark mode palette & custom status badges
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js v5) with Credentials provider (email + `bcryptjs`) & JWT session strategy
- **Containerization**: Docker (PostgreSQL 15 local database container `it-asset-pg`)

---

## 🗂️ Project Directory Structure

```text
IT asset Tracking app/
├── prisma/
│   ├── schema.prisma        # Prisma data models (User, Employee, Device, Assignment)
│   └── seed.ts              # Database seed script for initial IT user & demo inventory
├── src/
│   ├── app/                 # Next.js 15 App Router pages & API routes
│   │   ├── (auth)/login/    # Email + password authentication page
│   │   ├── dashboard/       # Metric summary counts & recent hardware overview
│   │   ├── devices/         # Device inventory list, details, edit, & creation routes
│   │   ├── employees/       # Employee directory, profile details, edit, & creation routes
│   │   ├── settings/users/  # IT-only User account management & employee linking
│   │   ├── api/auth/        # NextAuth handlers route
│   │   ├── globals.css      # Custom Tailwind CSS & glassmorphism variables
│   │   └── layout.tsx       # Root HTML & body layout wrapper
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar navigation, Navbar header
│   │   ├── ui/              # StatusBadge, RoleBadge components
│   │   ├── devices/         # DeviceTable, DeviceForm, ReassignModal, ChangeStatusModal
│   │   ├── employees/       # EmployeeTable, EmployeeForm
│   │   └── users/           # UserTable component & user creation modal
│   ├── lib/
│   │   ├── actions/         # Server Actions (devices.ts, employees.ts, users.ts)
│   │   ├── db.ts            # PrismaClient singleton instance
│   │   ├── auth.ts          # NextAuth configuration & Credentials provider
│   │   ├── auth.config.ts   # Edge-compatible NextAuth middleware callbacks
│   │   ├── permissions.ts   # Server-side role validation helpers (requireITRole)
│   │   └── constants.ts     # Hardware dropdowns (CPU, RAM, Storage) & status maps
│   ├── types/
│   │   └── next-auth.d.ts   # NextAuth Session & JWT type extensions (role, employeeId)
│   └── middleware.ts        # Next.js edge route protection middleware
├── .env                     # Environment variables (DATABASE_URL, NEXTAUTH_SECRET)
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
2. **`Employee`**:
   - `id`: CUID String primary key
   - `name`: String
   - `email`: String (unique)
   - `department`: String
   - Relations: Has optional `User` link, Has many `Assignment` records.
3. **`Device`**:
   - `id`: CUID String primary key
   - `brand`, `model`, `cpu`, `ram`, `storage`: String hardware specs
   - `serialNumber`: String (unique)
   - `purchaseDate`, `warrantyExpiry`: DateTime
   - `status`: Enum `DeviceStatus` (`IN_STOCK` | `ASSIGNED` | `IN_REPAIR` | `RETIRED`)
   - Relations: Has many `Assignment` records.
4. **`Assignment`**:
   - `id`: CUID String primary key
   - `deviceId`: FK to `Device`
   - `employeeId`: FK to `Employee`
   - `assignedAt`: DateTime (default `now()`)
   - `unassignedAt`: DateTime? (`null` means current active assignment)

---

## 🔒 Business Logic & Authorization Constraints

- **Assignment Rule**: An employee can hold at most **1 active laptop** (`unassignedAt = null`). Reassigning a device automatically closes out previous assignment records (`unassignedAt = now()`) and updates device status to `ASSIGNED`.
- **Manual Status Changes**: A device's status can only be manually updated to `IN_STOCK`, `IN_REPAIR`, or `RETIRED` by IT when it has **no active assignment**.
- **Append-Only History**: Historical `Assignment` records are preserved for auditing and never edited in place.
- **Role Enforcement**:
  - `IT`: Full CRUD on Devices, Employees, User Accounts, Assignments, Statuses.
  - `MANAGER`: Read-only access across all views.
  - Mutations enforce `requireITRole()` server-side; unauthorized mutation requests yield a `403 Forbidden` error.

---

## 🚀 Key Commands

```bash
# Start development server (http://localhost:3000)
pnpm dev

# Build production bundle
pnpm build

# Push database schema changes to PostgreSQL
pnpm exec prisma db push

# Seed initial IT user & demo data
pnpm prisma:seed
```
