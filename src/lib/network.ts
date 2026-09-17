import { db } from "@/lib/db";

/**
 * Fetch all network devices with their outgoing and incoming connections
 */
export async function getNetworkDevices() {
  try {
    const devices = await db.networkDevice.findMany({
      orderBy: [{ deviceType: "asc" }, { name: "asc" }],
      include: {
        outgoingConnections: {
          include: {
            targetNetworkDevice: {
              select: { id: true, name: true, deviceType: true, brand: true, model: true, ipAddress: true },
            },
            targetDevice: {
              select: { id: true, brand: true, model: true, serialNumber: true, deviceType: true, status: true },
            },
            targetPrinter: {
              select: { id: true, brand: true, model: true, ipAddress: true, location: true, status: true },
            },
          },
          orderBy: { fromPort: "asc" },
        },
        incomingConnections: {
          include: {
            fromDevice: {
              select: { id: true, name: true, deviceType: true, brand: true, model: true, ipAddress: true },
            },
          },
          orderBy: { fromPort: "asc" },
        },
      },
    });

    return { devices, error: null };
  } catch (error) {
    console.error("Failed to fetch network devices:", error);
    return { devices: [], error: "Failed to load network devices." };
  }
}

/**
 * Fetch complete topology data including unassigned devices and printers for patching
 */
export async function getNetworkTopologyData() {
  try {
    const [networkDevices, inventoryDevices, printers] = await Promise.all([
      db.networkDevice.findMany({
        orderBy: [{ deviceType: "asc" }, { name: "asc" }],
        include: {
          outgoingConnections: {
            include: {
              targetNetworkDevice: true,
              targetDevice: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  serialNumber: true,
                  deviceType: true,
                  status: true,
                  assignments: {
                    where: { unassignedAt: null },
                    include: { employee: { select: { name: true, department: true } } },
                    take: 1,
                  },
                },
              },
              targetPrinter: true,
            },
            orderBy: { fromPort: "asc" },
          },
          incomingConnections: {
            include: {
              fromDevice: true,
            },
          },
        },
      }),
      db.device.findMany({
        where: { status: { not: "RETIRED" } },
        select: {
          id: true,
          brand: true,
          model: true,
          serialNumber: true,
          deviceType: true,
          status: true,
          assignments: {
            where: { unassignedAt: null },
            include: { employee: { select: { name: true, department: true } } },
            take: 1,
          },
          networkConnections: {
            select: { id: true, fromDeviceId: true, fromPort: true },
          },
        },
        orderBy: { brand: "asc" },
      }),
      db.printer.findMany({
        select: {
          id: true,
          brand: true,
          model: true,
          ipAddress: true,
          location: true,
          status: true,
          networkConnections: {
            select: { id: true, fromDeviceId: true, fromPort: true },
          },
        },
        orderBy: { brand: "asc" },
      }),
    ]);

    return {
      networkDevices,
      inventoryDevices,
      printers,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch topology data:", error);
    return {
      networkDevices: [],
      inventoryDevices: [],
      printers: [],
      error: "Failed to load network topology.",
    };
  }
}
