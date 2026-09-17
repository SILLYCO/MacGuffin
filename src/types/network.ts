import { CableType, ConnectionSpeed, NetworkDeviceType, NetworkDeviceStatus } from "@prisma/client";

export interface PatchPortInput {
  fromDeviceId: string;
  fromPort: number;
  fromPortLabel?: string | null;
  targetType: "NETWORK_DEVICE" | "COMPUTER" | "PRINTER" | "ENDPOINT";
  targetNetworkDeviceId?: string | null;
  targetNetworkPort?: number | null;
  targetDeviceId?: string | null;
  targetPrinterId?: string | null;
  endpointName?: string | null;
  endpointType?: string | null;
  cableType: CableType;
  cableColor?: string | null;
  speed: ConnectionSpeed;
  vlan?: string | null;
  wallOutlet?: string | null;
  notes?: string | null;
}

export interface NetworkDeviceFormData {
  name: string;
  deviceType: NetworkDeviceType;
  brand: string;
  model: string;
  totalPorts: number;
  ipAddress?: string | null;
  macAddress?: string | null;
  location?: string | null;
  status: NetworkDeviceStatus;
  notes?: string | null;
}
