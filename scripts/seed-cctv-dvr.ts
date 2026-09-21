import { PrismaClient, NetworkDeviceType, NetworkDeviceStatus, CableType, ConnectionSpeed } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CHANNELS = [
  { channelNumber: 1, name: "Main Entrance", location: "Building Exterior / Gate", transcodeSub: false },
  { channelNumber: 2, name: "Reception Lobby", location: "Ground Floor Reception", transcodeSub: false },
  { channelNumber: 3, name: "Hallway A", location: "Ground Floor Corridor", transcodeSub: false },
  { channelNumber: 4, name: "Server Room", location: "IT Rack Room", transcodeSub: false },
  { channelNumber: 5, name: "Open Workspace 1", location: "Floor 1 - West Wing", transcodeSub: false },
  { channelNumber: 6, name: "Open Workspace 2", location: "Floor 1 - East Wing", transcodeSub: false },
  { channelNumber: 7, name: "Meeting Room Alpha", location: "Floor 1 - Conference A", transcodeSub: false },
  { channelNumber: 8, name: "Meeting Room Beta", location: "Floor 1 - Conference B", transcodeSub: false },
  { channelNumber: 9, name: "Cafeteria & Lounge", location: "Ground Floor Breakroom", transcodeSub: false },
  { channelNumber: 10, name: "Emergency Exit North", location: "North Stairwell", transcodeSub: false },
  { channelNumber: 11, name: "Emergency Exit South", location: "South Stairwell", transcodeSub: false },
  { channelNumber: 12, name: "Floor 2 Corridor", location: "Floor 2 - Main Hall", transcodeSub: false },
  { channelNumber: 13, name: "Executive Suite", location: "Floor 2 - Management", transcodeSub: false },
  { channelNumber: 14, name: "Storage Warehouse", location: "Basement Archive", transcodeSub: false },
  { channelNumber: 15, name: "Loading Bay", location: "Back Delivery Area", transcodeSub: false },
  { channelNumber: 16, name: "Parking Area", location: "Outdoor Staff Parking", transcodeSub: false },
];

async function main() {
  console.log("📹 Initializing CCTV DVR & 16-Channel Camera Setup...");

  try {
    // 1. Check if CameraDevice already exists
    let dvrDevice = await prisma.cameraDevice.findFirst({
      include: { channels: true },
    });

    if (!dvrDevice) {
      // Find or create the physical NetworkDevice for the DVR
      let netDevice = await prisma.networkDevice.findFirst({
        where: { ipAddress: "192.168.1.114" },
      });

      if (!netDevice) {
        netDevice = await prisma.networkDevice.create({
          data: {
            name: "Office CCTV DVR (Advision 16-Ch)",
            deviceType: NetworkDeviceType.DVR_NVR,
            brand: "Advision / Dahua",
            model: "16-Channel 1080N DVR",
            ipAddress: "192.168.1.114",
            macAddress: "E0:50:8B:2A:4C:9D",
            location: "Server Room - Rack A (U4)",
            totalPorts: 1,
            status: NetworkDeviceStatus.ONLINE,
            notes: "Advision 16-channel video security DVR, RTSP Port 554, HTTP Port 80",
          },
        });
        console.log(`✅ Registered physical Network Device for DVR: ${netDevice.name}`);

        // Try to link DVR to Core Switch if switch exists and port is free
        const coreSwitch = await prisma.networkDevice.findFirst({
          where: { deviceType: NetworkDeviceType.SWITCH },
        });

        if (coreSwitch) {
          const usedPorts = await prisma.networkConnection.findMany({
            where: { fromDeviceId: coreSwitch.id },
            select: { fromPort: true },
          });
          const usedSet = new Set(usedPorts.map((p) => p.fromPort));
          const freePort = [16, 15, 14, 13, 12, 11, 10].find((p) => !usedSet.has(p));

          if (freePort) {
            await prisma.networkConnection.create({
              data: {
                fromDeviceId: coreSwitch.id,
                fromPort: freePort,
                fromPortLabel: `Port ${freePort}`,
                targetNetworkDeviceId: netDevice.id,
                targetNetworkPort: 1,
                cableType: CableType.CAT6,
                cableColor: "Blue",
                speed: ConnectionSpeed.SPEED_1_GBPS,
                vlan: "30 (Security)",
                notes: "Dedicated Security CCTV Uplink to DVR",
              },
            });
            console.log(`✅ Patched DVR to ${coreSwitch.name} Port ${freePort}`);
          }
        }
      }

      // Create CameraDevice
      dvrDevice = await prisma.cameraDevice.create({
        data: {
          name: "Main Office DVR",
          brand: "Advision (Dahua-compatible)",
          model: "16-Channel 1080N DVR",
          host: "192.168.1.114",
          rtspPort: 554,
          httpPort: 80,
          totalChannels: 16,
          location: "Server Room - Rack A",
          enabled: true,
          notes: "Primary office video surveillance system",
          networkDeviceId: netDevice.id,
        },
        include: { channels: true },
      });
      console.log(`✅ Created CameraDevice: ${dvrDevice.name} (${dvrDevice.host})`);
    } else {
      console.log(`ℹ️ CameraDevice already exists: ${dvrDevice.name}`);
    }

    // 2. Ensure all 16 channels exist
    const existingChannels = await prisma.cameraChannel.findMany({
      where: { cameraDeviceId: dvrDevice.id },
    });
    const existingNumbers = new Set(existingChannels.map((c) => c.channelNumber));

    for (const ch of DEFAULT_CHANNELS) {
      if (!existingNumbers.has(ch.channelNumber)) {
        await prisma.cameraChannel.create({
          data: {
            cameraDeviceId: dvrDevice.id,
            channelNumber: ch.channelNumber,
            name: ch.name,
            location: ch.location,
            transcodeSub: ch.transcodeSub,
            sortOrder: ch.channelNumber,
            enabled: true,
          },
        });
        console.log(`  + Created Channel ${ch.channelNumber}: ${ch.name}`);
      }
    }

    console.log("🎉 CCTV DVR & Channels setup completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding CCTV DVR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
