import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ensureLiveStreamRegistered, exchangeWebRtcSdp } from "@/lib/cctv/gateway-client";
import { logAuditAction } from "@/lib/audit";
import { AuditAction, AuditEntityType, Role } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel: channelParam } = await context.params;
    const channelNumber = parseInt(channelParam, 10);
    if (isNaN(channelNumber) || channelNumber < 1 || channelNumber > 32) {
      return NextResponse.json({ error: "Invalid channel number" }, { status: 400 });
    }

    // Read body (either JSON or raw text)
    let sdpOffer = "";
    let quality: "sub" | "hd" = "sub";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await req.json();
      sdpOffer = json.sdp || "";
      quality = json.quality === "hd" ? "hd" : "sub";
    } else {
      sdpOffer = await req.text();
      const urlQuality = req.nextUrl.searchParams.get("quality");
      if (urlQuality === "hd") quality = "hd";
    }

    if (!sdpOffer) {
      return NextResponse.json({ error: "Missing SDP offer in request body" }, { status: 400 });
    }

    // Verify channel exists in DB
    const channel = await db.cameraChannel.findFirst({
      where: { channelNumber },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found in system" }, { status: 404 });
    }

    if (!channel.enabled) {
      return NextResponse.json(
        { error: `Camera channel #${channelNumber} (${channel.name}) is currently disabled` },
        { status: 403 }
      );
    }

    // Ensure stream is configured and active in go2rtc gateway
    const streamName = await ensureLiveStreamRegistered(
      channelNumber,
      quality,
      channel.transcodeSub
    );

    // Exchange SDP with go2rtc
    const sdpAnswer = await exchangeWebRtcSdp(streamName, sdpOffer);

    // Audit log live stream viewing
    await logAuditAction({
      action: AuditAction.CCTV_STREAM_VIEWED,
      entityType: AuditEntityType.CCTV_CAMERA,
      entityId: channel.id,
      entityName: `${channel.name} (Ch ${channelNumber})`,
      details: {
        channelNumber,
        quality,
        streamName,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    if (contentType.includes("application/json")) {
      return NextResponse.json({ sdp: sdpAnswer, streamName });
    } else {
      return new Response(sdpAnswer, {
        status: 200,
        headers: { "Content-Type": "application/sdp" },
      });
    }
  } catch (error: any) {
    console.error("[CCTV WebRTC Route] Error exchanging SDP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to establish WebRTC media session" },
      { status: 500 }
    );
  }
}
