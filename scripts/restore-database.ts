import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetFile = process.argv[2] || path.join(process.cwd(), "backups", "latest-backup.json");

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Backup file not found: ${targetFile}`);
    console.log("Please specify a valid backup JSON path, e.g.:");
    console.log("  pnpm exec tsx scripts/restore-database.ts backups/backup-2026-09-16.json");
    process.exit(1);
  }

  console.log(`📂 Reading backup from: ${targetFile}`);
  const rawData = fs.readFileSync(targetFile, "utf-8");
  const backup = JSON.parse(rawData);

  console.log(`⏱️ Backup was created at: ${backup.createdAt}`);
  console.log("\nRestoring records in safe dependency order...\n");

  const { data } = backup;

  try {
    // 1. Employees
    if (data.employees?.length) {
      console.log(`👤 Restoring ${data.employees.length} employees...`);
      for (const emp of data.employees) {
        await prisma.employee.upsert({
          where: { id: emp.id },
          create: {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            createdAt: new Date(emp.createdAt),
            updatedAt: new Date(emp.updatedAt),
          },
          update: {
            name: emp.name,
            email: emp.email,
            department: emp.department,
          },
        });
      }
    }

    // 2. Users
    if (data.users?.length) {
      console.log(`🔐 Restoring ${data.users.length} users...`);
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          create: {
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role,
            employeeId: u.employeeId ?? null,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
          update: {
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role,
            employeeId: u.employeeId ?? null,
          },
        });
      }
    }

    // 3. Devices
    if (data.devices?.length) {
      console.log(`💻 Restoring ${data.devices.length} devices...`);
      for (const dev of data.devices) {
        await prisma.device.upsert({
          where: { id: dev.id },
          create: {
            id: dev.id,
            deviceType: dev.deviceType,
            brand: dev.brand,
            model: dev.model,
            cpu: dev.cpu,
            ram: dev.ram,
            storage: dev.storage,
            serialNumber: dev.serialNumber,
            purchaseDate: dev.purchaseDate ? new Date(dev.purchaseDate) : null,
            warrantyExpiry: dev.warrantyExpiry ? new Date(dev.warrantyExpiry) : null,
            status: dev.status,
            createdAt: new Date(dev.createdAt),
            updatedAt: new Date(dev.updatedAt),
          },
          update: {
            brand: dev.brand,
            model: dev.model,
            cpu: dev.cpu,
            ram: dev.ram,
            storage: dev.storage,
            serialNumber: dev.serialNumber,
            status: dev.status,
          },
        });
      }
    }

    // 4. Assignments
    if (data.assignments?.length) {
      console.log(`📋 Restoring ${data.assignments.length} assignments...`);
      for (const asgn of data.assignments) {
        await prisma.assignment.upsert({
          where: { id: asgn.id },
          create: {
            id: asgn.id,
            deviceId: asgn.deviceId,
            employeeId: asgn.employeeId,
            assignedAt: new Date(asgn.assignedAt),
            unassignedAt: asgn.unassignedAt ? new Date(asgn.unassignedAt) : null,
          },
          update: {
            assignedAt: new Date(asgn.assignedAt),
            unassignedAt: asgn.unassignedAt ? new Date(asgn.unassignedAt) : null,
          },
        });
      }
    }

    // 5. Device Repairs
    if (data.repairs?.length) {
      console.log(`🔧 Restoring ${data.repairs.length} device repair records...`);
      for (const rep of data.repairs) {
        await prisma.repairRecord.upsert({
          where: { id: rep.id },
          create: {
            id: rep.id,
            deviceId: rep.deviceId,
            issueDescription: rep.issueDescription,
            resolutionNotes: rep.resolutionNotes ?? null,
            vendor: rep.vendor ?? null,
            reportedAt: new Date(rep.reportedAt),
            resolvedAt: rep.resolvedAt ? new Date(rep.resolvedAt) : null,
            reportedByEmail: rep.reportedByEmail,
            resolvedByEmail: rep.resolvedByEmail ?? null,
            createdAt: new Date(rep.createdAt),
            updatedAt: new Date(rep.updatedAt),
          },
          update: {
            issueDescription: rep.issueDescription,
            resolutionNotes: rep.resolutionNotes ?? null,
            resolvedAt: rep.resolvedAt ? new Date(rep.resolvedAt) : null,
          },
        });
      }
    }

    // 6. Printers
    if (data.printers?.length) {
      console.log(`🖨️ Restoring ${data.printers.length} printers...`);
      for (const pr of data.printers) {
        await prisma.printer.upsert({
          where: { id: pr.id },
          create: {
            id: pr.id,
            brand: pr.brand,
            model: pr.model,
            ipAddress: pr.ipAddress,
            macAddress: pr.macAddress,
            status: pr.status,
            location: pr.location ?? null,
            isColor: pr.isColor ?? false,
            canScan: pr.canScan ?? true,
            canCopy: pr.canCopy ?? true,
            isDuplex: pr.isDuplex ?? true,
            connectionType: pr.connectionType ?? "ETHERNET",
            driverUrl: pr.driverUrl ?? null,
            lastInkRefillDate: pr.lastInkRefillDate ? new Date(pr.lastInkRefillDate) : null,
            lastInkRefillNotes: pr.lastInkRefillNotes ?? null,
            createdAt: new Date(pr.createdAt),
            updatedAt: new Date(pr.updatedAt),
          },
          update: {
            status: pr.status,
            location: pr.location ?? null,
            lastInkRefillDate: pr.lastInkRefillDate ? new Date(pr.lastInkRefillDate) : null,
          },
        });
      }
    }

    // 7. Printer Ink Refills
    if (data.printerInkRefills?.length) {
      console.log(`💧 Restoring ${data.printerInkRefills.length} ink refills...`);
      for (const refill of data.printerInkRefills) {
        await prisma.printerInkRefill.upsert({
          where: { id: refill.id },
          create: {
            id: refill.id,
            printerId: refill.printerId,
            refillDate: new Date(refill.refillDate),
            notes: refill.notes ?? null,
            refilledByEmail: refill.refilledByEmail,
            createdAt: new Date(refill.createdAt),
          },
          update: {
            notes: refill.notes ?? null,
          },
        });
      }
    }

    // 8. Purchases & Items
    if (data.purchases?.length) {
      console.log(`🧾 Restoring ${data.purchases.length} purchases...`);
      for (const pur of data.purchases) {
        await prisma.purchase.upsert({
          where: { id: pur.id },
          create: {
            id: pur.id,
            title: pur.title ?? null,
            vendor: pur.vendor,
            invoiceNumber: pur.invoiceNumber ?? null,
            purchaseDate: new Date(pur.purchaseDate),
            totalAmount: pur.totalAmount,
            currency: pur.currency ?? "EGP",
            notes: pur.notes ?? null,
            purchasedBy: pur.purchasedBy,
            createdAt: new Date(pur.createdAt),
            updatedAt: new Date(pur.updatedAt),
          },
          update: {
            vendor: pur.vendor,
            totalAmount: pur.totalAmount,
          },
        });
      }
    }

    if (data.purchaseItems?.length) {
      console.log(`📦 Restoring ${data.purchaseItems.length} purchase items...`);
      for (const item of data.purchaseItems) {
        await prisma.purchaseItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            purchaseId: item.purchaseId,
            name: item.name,
            category: item.category,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            isTracked: item.isTracked,
            autoStocked: item.autoStocked,
            notes: item.notes ?? null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          update: {
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          },
        });
      }
    }

    // 9. Components
    if (data.components?.length) {
      console.log(`🧩 Restoring ${data.components.length} components...`);
      for (const comp of data.components) {
        await prisma.component.upsert({
          where: { id: comp.id },
          create: {
            id: comp.id,
            type: comp.type,
            brand: comp.brand,
            model: comp.model,
            capacity: comp.capacity ?? null,
            specs: comp.specs ?? null,
            serialNumber: comp.serialNumber,
            status: comp.status,
            notes: comp.notes ?? null,
            deviceId: comp.deviceId ?? null,
            purchaseItemId: comp.purchaseItemId ?? null,
            purchasePrice: comp.purchasePrice ?? null,
            createdAt: new Date(comp.createdAt),
            updatedAt: new Date(comp.updatedAt),
          },
          update: {
            status: comp.status,
            deviceId: comp.deviceId ?? null,
          },
        });
      }
    }

    // 10. Component Transfers
    if (data.componentTransfers?.length) {
      console.log(`🔄 Restoring ${data.componentTransfers.length} component transfers...`);
      for (const tr of data.componentTransfers) {
        await prisma.componentTransfer.upsert({
          where: { id: tr.id },
          create: {
            id: tr.id,
            componentId: tr.componentId,
            fromDeviceId: tr.fromDeviceId ?? null,
            fromDeviceName: tr.fromDeviceName ?? null,
            toDeviceId: tr.toDeviceId ?? null,
            toDeviceName: tr.toDeviceName ?? null,
            actionType: tr.actionType,
            reason: tr.reason ?? null,
            performedByEmail: tr.performedByEmail,
            transferredAt: new Date(tr.transferredAt),
          },
          update: {},
        });
      }
    }

    // 11. Audit Logs
    if (data.auditLogs?.length) {
      console.log(`📜 Restoring ${data.auditLogs.length} audit logs...`);
      for (const log of data.auditLogs) {
        await prisma.auditLog.upsert({
          where: { id: log.id },
          create: {
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId ?? null,
            entityName: log.entityName ?? null,
            actorId: log.actorId ?? null,
            actorEmail: log.actorEmail,
            actorRole: log.actorRole,
            details: log.details ?? null,
            createdAt: new Date(log.createdAt),
          },
          update: {},
        });
      }
    }

    // 12. Optional Work Credentials
    if (data.workCredentials?.length && "workCredential" in prisma) {
      console.log(`🔑 Restoring ${data.workCredentials.length} work credentials...`);
      for (const cred of data.workCredentials) {
        await (prisma as any).workCredential.upsert({
          where: { id: cred.id },
          create: {
            id: cred.id,
            employeeId: cred.employeeId,
            serviceName: cred.serviceName,
            serviceCategory: cred.serviceCategory,
            accountUsername: cred.accountUsername,
            accountPassword: cred.accountPassword,
            portalUrl: cred.portalUrl ?? null,
            status: cred.status,
            notes: cred.notes ?? null,
            lastRotatedAt: cred.lastRotatedAt ? new Date(cred.lastRotatedAt) : null,
            createdAt: new Date(cred.createdAt),
            updatedAt: new Date(cred.updatedAt),
          },
          update: {
            accountPassword: cred.accountPassword,
            status: cred.status,
          },
        });
      }
    }

    console.log("\n🎉 All records restored successfully!");
  } catch (error) {
    console.error("❌ Error restoring database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
