import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { registerPlaybackStream, exchangeWebRtcSdp, removeGatewayStream } from "@/lib/cctv/gateway-client";
import { logAuditAction } from "@/lib/audit";
import { AuditAction, AuditEntityType, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { channel, startTime, endTime, sdp } = body;

    const channelNumber = parseInt(channel, 10);
    if (isNaN(channelNumber) || channelNumber < 1 || channelNumber > 32) {
      return NextResponse.json({ error: "Invalid channel number" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required for playback" },
        { status: 400 }
      );
    }

    if (!sdp) {
      return NextResponse.json({ error: "Missing SDP offer" }, { status: 400 });
    }

    // Register user-isolated playback transcode session in go2rtc
    const streamName = await registerPlaybackStream(
      user.id,
      channelNumber,
      startTime,
      endTime
    );

    // Exchange SDP with go2rtc
    const sdpAnswer = await exchangeWebRtcSdp(streamName, sdp);

    // Audit log playback session
    await logAuditAction({
      action: AuditAction.CCTV_PLAYBACK_VIEWED,
      entityType: AuditEntityType.CCTV_CAMERA,
      entityName: `Channel ${channelNumber} Playback`,
      details: {
        channelNumber,
        startTime,
        endTime,
        streamName,
      },
      actor: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    });

    return NextResponse.json({ sdp: sdpAnswer, streamName });
  } catch (error: any) {
    console.error("[CCTV Playback Route] Error setting up playback session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate playback stream" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const streamName = searchParams.get("streamName");

    if (streamName && streamName.startsWith(`pb_${user.id}`)) {
      await removeGatewayStream(streamName);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid or unauthorized stream cleanup" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
