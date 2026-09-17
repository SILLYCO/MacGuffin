import { PrismaClient, NetworkDeviceType, NetworkDeviceStatus, CableType, ConnectionSpeed } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Office Network Topology Demo...");

  try {
    // Check if network devices already exist
    const existingCount = await prisma.networkDevice.count();
    if (existingCount > 0) {
      console.log(`ℹ️ Network devices already exist (${existingCount} found). Skipping demo seed.`);
      return;
    }

    // 1. Create Gateway Router
    const router = await prisma.networkDevice.create({
      data: {
        name: "Main Gateway Router",
        deviceType: NetworkDeviceType.ROUTER,
        brand: "MikroTik",
        model: "CCR2004-16G-2S+",
        totalPorts: 16,
        ipAddress: "192.168.1.1",
        macAddress: "48:8F:5A:11:22:33",
        location: "Server Room - Rack A (U1)",
        status: NetworkDeviceStatus.ONLINE,
        notes: "ISP Fiber Edge Router, DHCP Server, Firewall Gateway",
      },
    });
    console.log(`✅ Created Router: ${router.name}`);

    // 2. Create Core Switch 1 (Server Room)
    const switch1 = await prisma.networkDevice.create({
      data: {
        name: "Core Switch (Server Room)",
        deviceType: NetworkDeviceType.SWITCH,
        brand: "Cisco",
        model: "Catalyst 2960X-24TD-L",
        totalPorts: 24,
        ipAddress: "192.168.1.2",
        macAddress: "00:2A:6A:44:55:66",
        location: "Server Room - Rack A (U2)",
        status: NetworkDeviceStatus.ONLINE,
        notes: "Main office distribution switch, VLAN 10/20/30/40 trunking",
      },
    });
    console.log(`✅ Created Core Switch: ${switch1.name}`);

    // 3. Create Access Switch 2 (Floor 2)
    const switch2 = await prisma.networkDevice.create({
      data: {
        name: "Access Switch (Floor 2)",
        deviceType: NetworkDeviceType.SWITCH,
        brand: "Ubiquiti UniFi",
        model: "Pro 24 PoE",
        totalPorts: 24,
        ipAddress: "192.168.1.3",
        macAddress: "68:D7:9A:77:88:99",
        location: "Floor 2 - IT Cabinet",
        status: NetworkDeviceStatus.ONLINE,
        notes: "Floor 2 workstation distribution & PoE for access points",
      },
    });
    console.log(`✅ Created Access Switch: ${switch2.name}`);

    // Fetch existing computers and printers for realistic links
    const [devices, printers] = await Promise.all([
      prisma.device.findMany({ take: 4, orderBy: { createdAt: "desc" } }),
      prisma.printer.findMany({ take: 2 }),
    ]);

    // 4. Connect Router Port 1 -> Core Switch 1 Port 24 (10G SFP+ Fiber Uplink)
    await prisma.networkConnection.create({
      data: {
        fromDeviceId: router.id,
        fromPort: 1,
        fromPortLabel: "SFP+ 1 (LAN Trunk)",
        targetNetworkDeviceId: switch1.id,
        targetNetworkPort: 24,
        cableType: CableType.FIBER_SINGLE_MODE,
        cableColor: "Red",
        speed: ConnectionSpeed.SPEED_10_GBPS,
        vlan: "Trunk (All VLANs)",
        notes: "High-speed 10G optical fiber uplink to Core Switch",
      },
    });
    console.log("🔗 Connected Router Port 1 ➔ Core Switch Port 24 (10G Fiber Uplink)");

    // 5. Connect Core Switch 1 Port 1 to first computer (if exists)
    if (devices[0]) {
      await prisma.networkConnection.create({
        data: {
          fromDeviceId: switch1.id,
          fromPort: 1,
          fromPortLabel: "Port 1",
          targetDeviceId: devices[0].id,
          cableType: CableType.CAT6,
          cableColor: "Blue",
          speed: ConnectionSpeed.SPEED_1_GBPS,
          vlan: "10 (Corporate)",
          wallOutlet: "Plate 1A - Desk 101",
        },
      });
      console.log(`🔗 Connected Core Switch Port 1 ➔ Computer: ${devices[0].brand} ${devices[0].model}`);
    }

    // 6. Connect Core Switch 1 Port 2 to second computer (if exists)
    if (devices[1]) {
      await prisma.networkConnection.create({
        data: {
          fromDeviceId: switch1.id,
          fromPort: 2,
          fromPortLabel: "Port 2",
          targetDeviceId: devices[1].id,
          cableType: CableType.CAT6,
          cableColor: "Blue",
          speed: ConnectionSpeed.SPEED_1_GBPS,
          vlan: "10 (Corporate)",
          wallOutlet: "Plate 1B - Desk 102",
        },
      });
      console.log(`🔗 Connected Core Switch Port 2 ➔ Computer: ${devices[1].brand} ${devices[1].model}`);
    }

    // 7. Connect Core Switch 1 Port 3 to Printer 1 (if exists)
    if (printers[0]) {
      await prisma.networkConnection.create({
        data: {
          fromDeviceId: switch1.id,
          fromPort: 3,
          fromPortLabel: "Port 3",
          targetPrinterId: printers[0].id,
          cableType: CableType.CAT6,
          cableColor: "Orange",
          speed: ConnectionSpeed.SPEED_1_GBPS,
          vlan: "30 (Printers)",
          wallOutlet: "Plate 1C - Finance Area",
        },
      });
      console.log(`🔗 Connected Core Switch Port 3 ➔ Printer: ${printers[0].brand} ${printers[0].model}`);
    }

    // 8. Connect Core Switch 1 Port 23 ➔ Access Switch 2 Port 1 (Inter-switch Trunk)
    await prisma.networkConnection.create({
      data: {
        fromDeviceId: switch1.id,
        fromPort: 23,
        fromPortLabel: "Port 23 (Floor 2 Trunk)",
        targetNetworkDeviceId: switch2.id,
        targetNetworkPort: 1,
        cableType: CableType.CAT6A,
        cableColor: "Purple",
        speed: ConnectionSpeed.SPEED_10_GBPS,
        vlan: "Trunk (VLAN 10,20,30)",
        notes: "Solid Cat6A trunk run up riser conduit to Floor 2 switch",
      },
    });
    console.log("🔗 Connected Core Switch Port 23 ➔ Access Switch Port 1 (Inter-Switch Trunk)");

    // 9. Connect Access Switch 2 Port 2 to third computer (if exists)
    if (devices[2]) {
      await prisma.networkConnection.create({
        data: {
          fromDeviceId: switch2.id,
          fromPort: 2,
          fromPortLabel: "Port 2",
          targetDeviceId: devices[2].id,
          cableType: CableType.CAT6,
          cableColor: "Blue",
          speed: ConnectionSpeed.SPEED_1_GBPS,
          vlan: "10 (Corporate)",
          wallOutlet: "Plate 2A - Floor 2 Desk 204",
        },
      });
      console.log(`🔗 Connected Access Switch Port 2 ➔ Computer: ${devices[2].brand} ${devices[2].model}`);
    }

    // 10. Connect Access Switch 2 Port 3 to Printer 2 (if exists)
    if (printers[1]) {
      await prisma.networkConnection.create({
        data: {
          fromDeviceId: switch2.id,
          fromPort: 3,
          fromPortLabel: "Port 3",
          targetPrinterId: printers[1].id,
          cableType: CableType.CAT6,
          cableColor: "Orange",
          speed: ConnectionSpeed.SPEED_1_GBPS,
          vlan: "30 (Printers)",
          wallOutlet: "Plate 2B - Floor 2 Copy Room",
        },
      });
      console.log(`🔗 Connected Access Switch Port 3 ➔ Printer: ${printers[1].brand} ${printers[1].model}`);
    }

    // 11. Connect Access Switch 2 Port 8 to Meeting Room Smart TV (Generic endpoint)
    await prisma.networkConnection.create({
      data: {
        fromDeviceId: switch2.id,
        fromPort: 8,
        fromPortLabel: "Port 8",
        endpointName: "Meeting Room Smart TV (Samsung 75\")",
        endpointType: "SMART_TV",
        cableType: CableType.CAT6,
        cableColor: "Green",
        speed: ConnectionSpeed.SPEED_1_GBPS,
        vlan: "40 (Media & Display)",
        wallOutlet: "Plate 2D - Conf Room A",
        notes: "Direct Ethernet line behind presentation display",
      },
    });
    console.log("🔗 Connected Access Switch Port 8 ➔ Meeting Room Smart TV");

    console.log("\n🎉 Network topology demo seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding network demo:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
