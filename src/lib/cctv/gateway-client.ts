import { buildLiveRtspUrl, buildPlaybackRtspUrl } from "./dvr-client";

const GO2RTC_DEFAULT_URL = "http://127.0.0.1:1984";

export function getGatewayUrl(): string {
  return process.env.GO2RTC_API_URL || GO2RTC_DEFAULT_URL;
}

/**
 * Check if the go2rtc media gateway is running and responsive.
 */
export async function checkGatewayHealth(): Promise<{
  online: boolean;
  version?: string;
  url: string;
}> {
  const baseUrl = getGatewayUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${baseUrl}/api`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { online: true, version: data.version || "1.x", url: baseUrl };
    }
    return { online: false, url: baseUrl };
  } catch {
    return { online: false, url: baseUrl };
  }
}

/**
 * Registers or updates a named stream in the go2rtc gateway.
 * In go2rtc, PUT /api/streams?src={source}&name={name} registers a stream.
 */
export async function registerGatewayStream(
  name: string,
  sourceUrl: string
): Promise<boolean> {
  const baseUrl = getGatewayUrl();
  try {
    const url = new URL(`${baseUrl}/api/streams`);
    url.searchParams.set("name", name);
    url.searchParams.set("src", sourceUrl);

    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    });

    return res.ok;
  } catch (err: any) {
    console.warn(`[Gateway Client] Failed to register stream ${name}: ${err.message}`);
    return false;
  }
}

/**
 * Deletes a registered stream from go2rtc when finished (e.g. playback session).
 */
export async function removeGatewayStream(name: string): Promise<boolean> {
  const baseUrl = getGatewayUrl();
  try {
    const url = new URL(`${baseUrl}/api/streams`);
    url.searchParams.set("name", name);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      cache: "no-store",
    });

    return res.ok;
  } catch (err: any) {
    console.warn(`[Gateway Client] Failed to remove stream ${name}: ${err.message}`);
    return false;
  }
}

/**
 * Build stream name and source for a camera channel.
 * Quality: 'sub' (grid view) or 'hd' (full-screen main-stream)
 */
export function getChannelStreamConfig(
  channelNumber: number,
  quality: "sub" | "hd",
  transcodeSub: boolean = false
): { streamName: string; sourceUrl: string } {
  if (quality === "hd") {
    // HD main stream is H.265, so we use go2rtc's FFmpeg transcode pipeline to output standard H.264
    const rtsp = buildLiveRtspUrl(channelNumber, 0);
    return {
      streamName: `cam${channelNumber}_hd`,
      sourceUrl: `ffmpeg:${rtsp}#video=h264`,
    };
  }

  // Sub stream:
  // Channel 1 is H.264B baseline, while other channels output H.265 sub-streams on Advision/Dahua.
  // When transcodeSub is true or channelNumber > 1, transcode to browser-compatible H.264.
  const rtsp = buildLiveRtspUrl(channelNumber, 1);
  if (transcodeSub || channelNumber > 1) {
    return {
      streamName: `cam${channelNumber}_sub`,
      sourceUrl: `ffmpeg:${rtsp}#video=h264`,
    };
  }

  // Direct passthrough for Channel 1 H.264B sub-stream (Zero CPU overhead)
  return {
    streamName: `cam${channelNumber}_sub`,
    sourceUrl: rtsp,
  };
}

/**
 * Ensures a live camera stream is registered with go2rtc.
 */
export async function ensureLiveStreamRegistered(
  channelNumber: number,
  quality: "sub" | "hd",
  transcodeSub: boolean = false
): Promise<string> {
  const config = getChannelStreamConfig(channelNumber, quality, transcodeSub);
  await registerGatewayStream(config.streamName, config.sourceUrl);
  return config.streamName;
}

/**
 * Registers a user-isolated playback stream with go2rtc for a specific historical time window.
 */
export async function registerPlaybackStream(
  userId: string,
  channelNumber: number,
  startTime: string,
  endTime: string
): Promise<string> {
  const sessionId = Date.now().toString(36);
  const streamName = `pb_${userId}_ch${channelNumber}_${sessionId}`;
  const rtsp = buildPlaybackRtspUrl(channelNumber, startTime, endTime);
  // Playback recordings on Advision/Dahua are H.265 main streams, transcode to H.264
  const sourceUrl = `ffmpeg:${rtsp}#video=h264`;

  await registerGatewayStream(streamName, sourceUrl);
  return streamName;
}

/**
 * Exchanges WebRTC SDP offer with go2rtc for a given stream name.
 * Accepts SDP string or JSON object and returns SDP answer from go2rtc.
 */
export async function exchangeWebRtcSdp(
  streamName: string,
  sdpOffer: string
): Promise<string> {
  const baseUrl = getGatewayUrl();
  const url = `${baseUrl}/api/webrtc?src=${encodeURIComponent(streamName)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: sdpOffer,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Gateway WebRTC negotiation failed (${res.status}): ${errorText || res.statusText}`
    );
  }

  return await res.text();
}
