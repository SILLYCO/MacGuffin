import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";
import { CctvOverviewData, DvrRecordingFile, CameraChannelWithDevice } from "./types";
import { searchDvrRecordings } from "./dvr-client";
import { logAuditAction } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@prisma/client";

export async function getCctvOverviewData(): Promise<CctvOverviewData> {
  const user = await getCurrentUser();
  const userRole = user?.role || "MANAGER";

  const device = await db.cameraDevice.findFirst({
    include: {
      networkDevice: {
        select: {
          id: true,
          name: true,
          location: true,
          incomingConnections: {
            select: {
              id: true,
              fromPort: true,
              fromDevice: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      channels: {
        orderBy: [
          { sortOrder: "asc" },
          { channelNumber: "asc" },
        ],
      },
    },
  });

  if (!device) {
    return {
      device: null,
      channels: [],
      stats: {
        totalChannels: 0,
        activeChannels: 0,
        transcodedChannels: 0,
        networkStatus: "UNKNOWN",
      },
      userRole,
    };
  }

  const channels: CameraChannelWithDevice[] = device.channels.map((ch) => ({
    ...ch,
    cameraDevice: {
      id: device.id,
      name: device.name,
      brand: device.brand,
      model: device.model,
      host: device.host,
      rtspPort: device.rtspPort,
      httpPort: device.httpPort,
      totalChannels: device.totalChannels,
      location: device.location,
      enabled: device.enabled,
      networkDeviceId: device.networkDeviceId,
      networkDevice: device.networkDevice,
    },
  }));

  const totalChannels = channels.length;
  const activeChannels = channels.filter((c) => c.enabled).length;
  const transcodedChannels = channels.filter((c) => c.transcodeSub).length;

  return {
    device,
    channels,
    stats: {
      totalChannels,
      activeChannels,
      transcodedChannels,
      networkStatus: "ONLINE",
    },
    userRole,
  };
}

export async function searchChannelRecordingsQuery(
  channelNumber: number,
  dateStr: string
): Promise<DvrRecordingFile[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const recordings = await searchDvrRecordings(channelNumber, dateStr);

  await logAuditAction({
    action: AuditAction.CCTV_RECORDING_SEARCHED,
    entityType: AuditEntityType.CCTV_CAMERA,
    entityName: `Channel ${channelNumber}`,
    details: {
      channelNumber,
      date: dateStr,
      resultsCount: recordings.length,
    },
  });

  return recordings;
}
