export type DvrRecordingType = 'general' | 'motion' | 'alarm';

export interface DvrRecordingFile {
  channel: number;
  startTime: string; // "YYYY-MM-DD HH:mm:ss"
  endTime: string;   // "YYYY-MM-DD HH:mm:ss"
  startSeconds: number; // 0..86399 (seconds from midnight for 24h timeline)
  endSeconds: number;   // 0..86400 (seconds from midnight for 24h timeline)
  length: number;    // duration in seconds
  type: DvrRecordingType;
  filePath?: string;
}

export interface CameraChannelWithDevice {
  id: string;
  cameraDeviceId: string;
  channelNumber: number;
  name: string;
  location: string | null;
  transcodeSub: boolean;
  sortOrder: number;
  enabled: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  cameraDevice: {
    id: string;
    name: string;
    brand: string;
    model: string | null;
    host: string;
    rtspPort: number;
    httpPort: number;
    totalChannels: number;
    location: string | null;
    enabled: boolean;
    networkDeviceId: string | null;
    networkDevice?: {
      id: string;
      name: string;
      location: string | null;
      incomingConnections?: Array<{
        id: string;
        fromPort: number;
        fromDevice: {
          id: string;
          name: string;
        };
      }>;
    } | null;
  };
}

export interface CctvOverviewData {
  device: {
    id: string;
    name: string;
    brand: string;
    model: string | null;
    host: string;
    rtspPort: number;
    httpPort: number;
    totalChannels: number;
    location: string | null;
    enabled: boolean;
    networkDeviceId: string | null;
    networkDevice?: {
      id: string;
      name: string;
      location: string | null;
      incomingConnections?: Array<{
        id: string;
        fromPort: number;
        fromDevice: {
          id: string;
          name: string;
        };
      }>;
    } | null;
  } | null;
  channels: CameraChannelWithDevice[];
  stats: {
    totalChannels: number;
    activeChannels: number;
    transcodedChannels: number;
    networkStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  };
  userRole: string;
}
