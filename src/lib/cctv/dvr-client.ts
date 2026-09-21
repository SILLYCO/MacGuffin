import crypto from "crypto";
import { DvrRecordingFile, DvrRecordingType } from "./types";

interface DigestCredentials {
  username: string;
  password: string;
  realm?: string;
  nonce?: string;
  qop?: string;
  opaque?: string;
  nc?: number;
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function parseDigestHeader(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleaned = header.replace(/^Digest\s+/i, "");
  const regex = /(\w+)="?([^",]+)"?/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    params[match[1]] = match[2];
  }
  return params;
}

function buildDigestHeader(
  method: string,
  uri: string,
  creds: DigestCredentials
): string {
  const ha1 = md5(`${creds.username}:${creds.realm || ""}:${creds.password}`);
  const ha2 = md5(`${method}:${uri}`);

  if (creds.qop && creds.qop.includes("auth")) {
    const ncVal = (creds.nc || 1).toString(16).padStart(8, "0");
    const cnonce = crypto.randomBytes(8).toString("hex");
    const response = md5(
      `${ha1}:${creds.nonce}:${ncVal}:${cnonce}:auth:${ha2}`
    );

    let header = `Digest username="${creds.username}", realm="${creds.realm}", nonce="${creds.nonce}", uri="${uri}", response="${response}", qop=auth, nc=${ncVal}, cnonce="${cnonce}"`;
    if (creds.opaque) {
      header += `, opaque="${creds.opaque}"`;
    }
    return header;
  } else {
    const response = md5(`${ha1}:${creds.nonce}:${ha2}`);
    let header = `Digest username="${creds.username}", realm="${creds.realm}", nonce="${creds.nonce}", uri="${uri}", response="${response}"`;
    if (creds.opaque) {
      header += `, opaque="${creds.opaque}"`;
    }
    return header;
  }
}

/**
 * Execute an HTTP request with Dahua Digest Authentication support.
 */
async function fetchWithDigestAuth(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; text: string }> {
  const username = process.env.DVR_USER || "admin";
  const password = process.env.DVR_PASS || "";
  const parsedUrl = new URL(url);
  const uri = parsedUrl.pathname + parsedUrl.search;
  const method = options.method || "GET";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // Step 1: Send initial request without auth (or with cached challenge)
    const initialRes = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (initialRes.status !== 401) {
      const text = await initialRes.text();
      return { ok: initialRes.ok, status: initialRes.status, text };
    }

    // Step 2: Handle 401 challenge
    const authHeader = initialRes.headers.get("www-authenticate");
    if (!authHeader || !authHeader.toLowerCase().startsWith("digest")) {
      return { ok: false, status: initialRes.status, text: "No Digest auth challenge received" };
    }

    const params = parseDigestHeader(authHeader);
    const digestHeader = buildDigestHeader(method, uri, {
      username,
      password,
      realm: params.realm,
      nonce: params.nonce,
      qop: params.qop,
      opaque: params.opaque,
      nc: 1,
    });

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", digestHeader);

    // Step 3: Resend with Digest header
    const authedRes = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await authedRes.text();
    return { ok: authedRes.ok, status: authedRes.status, text };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Connection timed out contacting DVR at ${parsedUrl.host}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Constructs the Dahua RTSP URL for live streaming.
 * Subtype 1 = Sub Stream (for 16-channel grids, low-bitrate)
 * Subtype 0 = Main Stream (for HD full-screen, high-res)
 */
export function buildLiveRtspUrl(
  channel: number,
  subtype: 0 | 1 = 1,
  customHost?: string,
  customPort?: number
): string {
  const user = encodeURIComponent(process.env.DVR_USER || "admin");
  const pass = encodeURIComponent(process.env.DVR_PASS || "");
  const host = customHost || process.env.DVR_HOST || "192.168.1.114";
  const port = customPort || process.env.DVR_RTSP_PORT || 554;

  return `rtsp://${user}:${pass}@${host}:${port}/cam/realmonitor?channel=${channel}&subtype=${subtype}`;
}

/**
 * Formats a Date object or ISO string to Dahua DVR local time string: YYYY_MM_DD_hh_mm_ss
 */
export function formatDahuaRtspTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
}

/**
 * Constructs the Dahua RTSP URL for historical video playback.
 */
export function buildPlaybackRtspUrl(
  channel: number,
  startTime: Date | string,
  endTime: Date | string,
  customHost?: string,
  customPort?: number
): string {
  const user = encodeURIComponent(process.env.DVR_USER || "admin");
  const pass = encodeURIComponent(process.env.DVR_PASS || "");
  const host = customHost || process.env.DVR_HOST || "192.168.1.114";
  const port = customPort || process.env.DVR_RTSP_PORT || 554;

  const startFormatted = formatDahuaRtspTimestamp(startTime);
  const endFormatted = formatDahuaRtspTimestamp(endTime);

  return `rtsp://${user}:${pass}@${host}:${port}/cam/playback?channel=${channel}&subtype=0&starttime=${startFormatted}&endtime=${endFormatted}`;
}

/**
 * Helper to convert "HH:mm:ss" or "YYYY-MM-DD HH:mm:ss" into seconds from midnight (0..86399)
 */
function toSecondsFromMidnight(timeStr: string): number {
  const timePart = timeStr.includes(" ") ? timeStr.split(" ")[1] : timeStr;
  const [hh, mm, ss] = timePart.split(":").map((v) => parseInt(v, 10) || 0);
  return hh * 3600 + mm * 60 + ss;
}

/**
 * Parse Dahua mediaFileFind findNextFile response key-value text lines.
 */
export function parseDvrRecordingLines(
  rawText: string,
  channel: number
): DvrRecordingFile[] {
  const lines = rawText.split(/\r?\n/);
  const itemMap: Record<number, Partial<DvrRecordingFile> & { event?: string }> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // e.g. items[0].StartTime=2026-09-21 08:00:00
    const match = trimmed.match(/^items\[(\d+)\]\.(\w+)(?:\[\d+\])?=(.*)$/);
    if (!match) continue;

    const index = parseInt(match[1], 10);
    const key = match[2];
    const value = match[3];

    if (!itemMap[index]) {
      itemMap[index] = { channel };
    }

    if (key === "StartTime") {
      itemMap[index].startTime = value;
      itemMap[index].startSeconds = toSecondsFromMidnight(value);
    } else if (key === "EndTime") {
      itemMap[index].endTime = value;
      itemMap[index].endSeconds = toSecondsFromMidnight(value);
    } else if (key === "Length") {
      itemMap[index].length = parseInt(value, 10) || 0;
    } else if (key === "FilePath") {
      itemMap[index].filePath = value;
    } else if (key === "Type" || key === "Events") {
      itemMap[index].event = (itemMap[index].event || "") + " " + value;
    }
  }

  const recordings: DvrRecordingFile[] = [];

  for (const item of Object.values(itemMap)) {
    if (item.startTime && item.endTime) {
      let type: DvrRecordingType = "general";
      const eventStr = (item.event || "").toLowerCase();

      if (eventStr.includes("motion") || eventStr.includes("md")) {
        type = "motion";
      } else if (eventStr.includes("alarm")) {
        type = "alarm";
      }

      const startSeconds = item.startSeconds ?? toSecondsFromMidnight(item.startTime);
      const endSeconds = item.endSeconds ?? toSecondsFromMidnight(item.endTime);
      const length = Math.max(0, endSeconds - startSeconds);

      recordings.push({
        channel,
        startTime: item.startTime,
        endTime: item.endTime,
        startSeconds,
        endSeconds,
        length,
        type,
        filePath: item.filePath,
      });
    }
  }

  // Sort chronologically
  return recordings.sort((a, b) => a.startSeconds - b.startSeconds);
}

/**
 * Searches recording files on the Advision/Dahua DVR for a given channel and calendar date (YYYY-MM-DD).
 * Executes the 4-step mediaFileFind.cgi sequence:
 * 1. factory.create -> obtain object ID
 * 2. findFile -> initiate search condition
 * 3. findNextFile -> fetch results loop
 * 4. close & destroy -> release handles (guaranteed in finally block)
 */
export async function searchDvrRecordings(
  channel: number,
  dateStr: string,
  customHost?: string,
  customPort?: number
): Promise<DvrRecordingFile[]> {
  const host = customHost || process.env.DVR_HOST || "192.168.1.114";
  const httpPort = customPort || process.env.DVR_HTTP_PORT || 80;
  const baseUrl = process.env.DVR_HTTP_URL
    ? `${process.env.DVR_HTTP_URL.replace(/\/+$/, "")}/cgi-bin/mediaFileFind.cgi`
    : `http://${host}:${httpPort}/cgi-bin/mediaFileFind.cgi`;

  let objectId: string | null = null;
  const allRecordings: DvrRecordingFile[] = [];

  try {
    // Step 1: Create search instance
    const createRes = await fetchWithDigestAuth(`${baseUrl}?action=factory.create`);
    if (!createRes.ok) {
      console.warn(`[DVR Client] factory.create failed (${createRes.status}): ${createRes.text}`);
      return [];
    }

    const objectMatch = createRes.text.match(/result=(\w+)/i);
    if (!objectMatch || !objectMatch[1]) {
      console.warn(`[DVR Client] Could not parse object ID from: ${createRes.text}`);
      return [];
    }
    objectId = objectMatch[1];

    // Step 2: Set search conditions (Full 24-hour day in DVR local time)
    const startTime = `${dateStr} 00:00:00`;
    const endTime = `${dateStr} 23:59:59`;

    const findUrl = `${baseUrl}?action=findFile&object=${objectId}&condition.Channel=${channel}&condition.StartTime=${encodeURIComponent(
      startTime
    )}&condition.EndTime=${encodeURIComponent(endTime)}&condition.Types[0]=dav`;

    const findRes = await fetchWithDigestAuth(findUrl);
    if (!findRes.ok || !findRes.text.includes("OK") && !findRes.text.includes("result=true")) {
      console.warn(`[DVR Client] findFile returned non-OK: ${findRes.text}`);
    }

    // Step 3: Fetch matching file items in batches of 100
    let hasMore = true;
    let iterations = 0;
    const maxIterations = 20; // safety ceiling (up to 2000 recording clips)

    while (hasMore && iterations < maxIterations) {
      iterations++;
      const nextUrl = `${baseUrl}?action=findNextFile&object=${objectId}&count=100`;
      const nextRes = await fetchWithDigestAuth(nextUrl);

      if (!nextRes.ok) break;

      const batch = parseDvrRecordingLines(nextRes.text, channel);
      allRecordings.push(...batch);

      const foundMatch = nextRes.text.match(/found=(\d+)/i);
      const foundCount = foundMatch ? parseInt(foundMatch[1], 10) : 0;

      if (foundCount < 100) {
        hasMore = false;
      }
    }

    return allRecordings;
  } catch (error: any) {
    console.warn(`[DVR Client] Error querying DVR recordings: ${error.message}`);
    return [];
  } finally {
    // Step 4: Always close and destroy object handle to avoid resource exhaustion on DVR
    if (objectId) {
      try {
        await fetchWithDigestAuth(`${baseUrl}?action=close&object=${objectId}`);
        await fetchWithDigestAuth(`${baseUrl}?action=destroy&object=${objectId}`);
      } catch (e) {
        // Silently catch cleanup errors
      }
    }
  }
}

/**
 * Pings the DVR HTTP service to verify reachability and credentials.
 */
export async function testDvrConnectivity(
  customHost?: string,
  customPort?: number
): Promise<{ online: boolean; latencyMs: number; message: string }> {
  const host = customHost || process.env.DVR_HOST || "192.168.1.114";
  const httpPort = customPort || process.env.DVR_HTTP_PORT || 80;
  const url = process.env.DVR_HTTP_URL
    ? `${process.env.DVR_HTTP_URL.replace(/\/+$/, "")}/cgi-bin/magicBox.cgi?action=getSystemInfo`
    : `http://${host}:${httpPort}/cgi-bin/magicBox.cgi?action=getSystemInfo`;

  const startTime = Date.now();
  try {
    const res = await fetchWithDigestAuth(url);
    const latencyMs = Date.now() - startTime;

    if (
      res.ok &&
      (res.text.includes("deviceType") ||
        res.text.includes("processor") ||
        res.text.includes("serialNumber") ||
        res.text.includes("XVR"))
    ) {
      return {
        online: true,
        latencyMs,
        message: `DVR Online and authenticated (${latencyMs}ms response)`,
      };
    } else if (res.status === 401) {
      return {
        online: false,
        latencyMs,
        message: "DVR reachable but authentication failed. Verify DVR_USER and DVR_PASS.",
      };
    } else {
      return {
        online: false,
        latencyMs,
        message: `DVR responded with status ${res.status}: ${res.text.slice(0, 100)}`,
      };
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      online: false,
      latencyMs,
      message: `DVR unreachable: ${error.message}`,
    };
  }
}
