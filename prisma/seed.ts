import { PrismaClient, Role, DeviceStatus, AuditAction, AuditEntityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const initialEmail = process.env.INITIAL_IT_EMAIL || "admin@company.com";
  const initialPassword = process.env.INITIAL_IT_PASSWORD || "AdminPassword123!";

  console.log(`Starting seed process...`);

  // 1. Create or update initial IT User
  const passwordHash = await bcrypt.hash(initialPassword, 10);
  const itUser = await prisma.user.upsert({
    where: { email: initialEmail },
    update: {
      passwordHash,
      role: Role.IT,
    },
    create: {
      email: initialEmail,
      passwordHash,
      role: Role.IT,
    },
  });

  console.log(`✅ Initial IT User created/updated: ${itUser.email}`);

  // 2. Create sample Employees
  const employeeData = [
    { name: "Sarah Connor", email: "sarah.connor@company.com", department: "Engineering" },
    { name: "Alex Mercer", email: "alex.mercer@company.com", department: "IT & Security" },
    { name: "Elena Rostova", email: "elena.rostova@company.com", department: "Product" },
    { name: "David Chen", email: "david.chen@company.com", department: "Design" },
    { name: "Marcus Vance", email: "marcus.vance@company.com", department: "Sales" },
    { name: "Rachel Green", email: "rachel.green@company.com", department: "Marketing" },
  ];

  const employees = [];
  for (const emp of employeeData) {
    const created = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: emp,
    });
    employees.push(created);
  }
  console.log(`✅ ${employees.length} Sample Employees created`);

  // 3. Create sample Manager User linked to Marcus Vance
  const managerPassword = await bcrypt.hash("ManagerPass123!", 10);
  const marcus = employees.find((e) => e.email === "marcus.vance@company.com");
  
  if (marcus) {
    await prisma.user.upsert({
      where: { email: "manager@company.com" },
      update: {
        passwordHash: managerPassword,
        role: Role.MANAGER,
        employeeId: marcus.id,
      },
      create: {
        email: "manager@company.com",
        passwordHash: managerPassword,
        role: Role.MANAGER,
        employeeId: marcus.id,
      },
    });
    console.log(`✅ Sample Manager User created: manager@company.com (Linked to ${marcus.name})`);
  }

  // 4. Create sample Devices & Assignments
  const deviceData = [
    {
      brand: "Apple",
      model: "MacBook Pro 16\"",
      cpu: "Apple M3 Max",
      ram: "32 GB",
      storage: "1 TB SSD",
      serialNumber: "C02G1234MD6R",
      purchaseDate: new Date("2024-01-15"),
      warrantyExpiry: new Date("2027-01-15"),
      status: DeviceStatus.ASSIGNED,
      assignedTo: "sarah.connor@company.com",
    },
    {
      brand: "Dell",
      model: "XPS 15 9530",
      cpu: "Intel Core i7-13700H",
      ram: "32 GB",
      storage: "1 TB SSD",
      serialNumber: "DLXPS9530-88A",
      purchaseDate: new Date("2023-06-20"),
      warrantyExpiry: new Date("2026-06-20"),
      status: DeviceStatus.ASSIGNED,
      assignedTo: "alex.mercer@company.com",
    },
    {
      brand: "Lenovo",
      model: "ThinkPad X1 Carbon Gen 11",
      cpu: "Intel Core i7-13700H",
      ram: "16 GB",
      storage: "512 GB SSD",
      serialNumber: "PF4992X1C11",
      purchaseDate: new Date("2023-11-10"),
      warrantyExpiry: new Date("2026-11-10"),
      status: DeviceStatus.ASSIGNED,
      assignedTo: "elena.rostova@company.com",
    },
    {
      brand: "Apple",
      model: "MacBook Air 15\"",
      cpu: "Apple M2",
      ram: "16 GB",
      storage: "512 GB SSD",
      serialNumber: "C02M2AIR15-99",
      purchaseDate: new Date("2023-09-01"),
      warrantyExpiry: new Date("2025-09-01"),
      status: DeviceStatus.IN_STOCK,
    },
    {
      brand: "Framework",
      model: "Laptop 16",
      cpu: "AMD Ryzen 7 7840HS",
      ram: "32 GB",
      storage: "1 TB SSD",
      serialNumber: "FW16-AMD7840-01",
      purchaseDate: new Date("2024-03-01"),
      warrantyExpiry: new Date("2026-03-01"),
      status: DeviceStatus.IN_REPAIR,
    },
    {
      brand: "HP",
      model: "EliteBook 840 G10",
      cpu: "Intel Core i5-13400H",
      ram: "16 GB",
      storage: "512 GB SSD",
      serialNumber: "HPEB840G10-44",
      purchaseDate: new Date("2022-04-12"),
      warrantyExpiry: new Date("2025-04-12"),
      status: DeviceStatus.RETIRED,
    },
  ];

  for (const item of deviceData) {
    const { assignedTo, ...deviceInfo } = item;

    const device = await prisma.device.upsert({
      where: { serialNumber: deviceInfo.serialNumber },
      update: {},
      create: deviceInfo,
    });

    if (assignedTo) {
      const emp = employees.find((e) => e.email === assignedTo);
      if (emp) {
        // Create active assignment if not exists
        const existingActive = await prisma.assignment.findFirst({
          where: { deviceId: device.id, unassignedAt: null },
        });

        if (!existingActive) {
          await prisma.assignment.create({
            data: {
              deviceId: device.id,
              employeeId: emp.id,
              assignedAt: new Date(deviceInfo.purchaseDate.getTime() + 86400000), // Day after purchase
            },
          });
        }
      }
    }
  }

  // 5. Seed initial audit log entries if empty
  const existingAuditCount = await prisma.auditLog.count();
  if (existingAuditCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          action: AuditAction.DEVICE_CREATED,
          entityType: AuditEntityType.DEVICE,
          entityName: "Apple MacBook Pro 16\" (C02G1234MD6R)",
          actorId: itUser.id,
          actorEmail: itUser.email,
          actorRole: Role.IT,
          details: JSON.stringify({ brand: "Apple", model: "MacBook Pro 16\"", ram: "32 GB", storage: "1 TB SSD" }),
          createdAt: new Date(Date.now() - 4 * 86400000),
        },
        {
          action: AuditAction.EMPLOYEE_CREATED,
          entityType: AuditEntityType.EMPLOYEE,
          entityName: "Sarah Connor (Engineering)",
          actorId: itUser.id,
          actorEmail: itUser.email,
          actorRole: Role.IT,
          details: JSON.stringify({ email: "sarah.connor@company.com", department: "Engineering" }),
          createdAt: new Date(Date.now() - 3 * 86400000),
        },
        {
          action: AuditAction.DEVICE_ASSIGNED,
          entityType: AuditEntityType.ASSIGNMENT,
          entityName: "Apple MacBook Pro 16\" (C02G1234MD6R)",
          actorId: itUser.id,
          actorEmail: itUser.email,
          actorRole: Role.IT,
          details: JSON.stringify({ assignedToEmployee: "Sarah Connor (Engineering)" }),
          createdAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          action: AuditAction.DEVICE_STATUS_CHANGED,
          entityType: AuditEntityType.DEVICE,
          entityName: "Framework Laptop 16 (FW16-AMD7840-01)",
          actorId: itUser.id,
          actorEmail: itUser.email,
          actorRole: Role.IT,
          details: JSON.stringify({ fromStatus: "IN_STOCK", toStatus: "IN_REPAIR" }),
          createdAt: new Date(Date.now() - 1 * 86400000),
        },
      ],
    });
    console.log(`✅ Sample Audit Logs seeded`);
  }

  console.log(`✅ Sample Devices & Assignments created`);
  console.log(`🎉 Seeding complete!`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
