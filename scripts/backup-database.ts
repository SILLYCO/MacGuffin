import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Connecting to database and extracting all data...");

  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);
  const latestPath = path.join(backupDir, "latest-backup.json");

  try {
    // Collect data across all models
    const [
      users,
      employees,
      devices,
      assignments,
      repairs,
      auditLogs,
      printers,
      printerRepairs,
      printerInkRefills,
      components,
      componentTransfers,
      purchases,
      purchaseItems,
      networkDevices,
      networkConnections,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.employee.findMany(),
      prisma.device.findMany(),
      prisma.assignment.findMany(),
      prisma.repairRecord.findMany(),
      prisma.auditLog.findMany(),
      prisma.printer.findMany(),
      prisma.printerRepairRecord.findMany(),
      prisma.printerInkRefill.findMany(),
      prisma.component.findMany(),
      prisma.componentTransfer.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.networkDevice.findMany(),
      prisma.networkConnection.findMany(),
    ]);

    // Check optional work credentials if model exists
    let workCredentials: any[] = [];
    if ("workCredential" in prisma && typeof (prisma as any).workCredential?.findMany === "function") {
      try {
        workCredentials = await (prisma as any).workCredential.findMany();
      } catch {
        // Table may not exist yet if branch doesn't have it
      }
    }

    const backupData = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      counts: {
        users: users.length,
        employees: employees.length,
        devices: devices.length,
        assignments: assignments.length,
        repairs: repairs.length,
        auditLogs: auditLogs.length,
        printers: printers.length,
        printerRepairs: printerRepairs.length,
        printerInkRefills: printerInkRefills.length,
        components: components.length,
        componentTransfers: componentTransfers.length,
        purchases: purchases.length,
        purchaseItems: purchaseItems.length,
        networkDevices: networkDevices.length,
        networkConnections: networkConnections.length,
        workCredentials: workCredentials.length,
      },
      data: {
        users,
        employees,
        devices,
        assignments,
        repairs,
        auditLogs,
        printers,
        printerRepairs,
        printerInkRefills,
        components,
        componentTransfers,
        purchases,
        purchaseItems,
        networkDevices,
        networkConnections,
        workCredentials,
      },
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, jsonContent, "utf-8");
    fs.writeFileSync(latestPath, jsonContent, "utf-8");

    console.log("\n✅ Database backup completed successfully!");
    console.log(`📁 File saved to: ${filepath}`);
    console.log(`🔗 Symlink/copy updated at: ${latestPath}\n`);

    console.log("📊 Summary of Backed-Up Records:");
    console.table(backupData.counts);
  } catch (error) {
    console.error("❌ Error backing up database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
